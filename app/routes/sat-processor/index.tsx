import { Download, Upload } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router'
import type { PaginationState } from '@tanstack/react-table'
import { DataTable } from '~/components/dataTable/DataTable'
import { Button } from '~/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '~/components/ui/dialog'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '~/components/ui/drawer'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'
import { Tabs, TabsList, TabsTrigger } from '~/components/ui/tabs'
import { accountsRepository } from '~/features/accounts/server/repository'
import { companyRepository } from '~/features/company/server/repository/company.repository'
import { processSatRecordAction } from '~/features/journal-entry/server/actions/process-sat-record.action'
import { SatFileColumns } from '~/features/sat-processor/components/Columns'
import { ProTipCard } from '~/features/sat-processor/components/ProTipCard'
import { SelectedRowDetails } from '~/features/sat-processor/components/SelectedRowDetails'
import { UploadDropzone } from '~/features/sat-processor/components/UploadDropzone'
import { invoiceTypeSchema } from '~/features/sat-processor/schemas'
import { uploadSatFileAction } from '~/features/sat-processor/server/actions/upload.action'
import { satFileRepository } from '~/features/sat-processor/server/repository/sat-file.repository'
import { requireAuth } from '~/server/auth/session.server'
import type { SatFile } from '~/server/db/schemas/sat-file'
import type { Route } from './+types'

const PAGE_SIZE = 50

export async function loader({ request }: Route.LoaderArgs) {
  const session = await requireAuth(request)
  const url = new URL(request.url)
  const companyId = url.searchParams.get('companyId') ?? undefined
  const status = url.searchParams.get('status') ?? 'assigned'
  const search = url.searchParams.get('search') ?? undefined
  const dateFrom = url.searchParams.get('dateFrom') ?? undefined
  const dateTo = url.searchParams.get('dateTo') ?? undefined
  const page = Math.max(1, parseInt(url.searchParams.get('page') ?? '1', 10))

  if (!session.session.activeOrganizationId) {
    return {
      satFiles: [],
      accounts: [],
      companies: [],
      stats: { total: 0, matched: 0, review: 0 },
      status,
      total: 0,
      page: 1,
      pageSize: PAGE_SIZE,
    }
  }

  const organizationId = session.session.activeOrganizationId
  const pendingRows =
    status === 'pending' ? true : status === 'assigned' ? false : undefined

  const queryOptions = {
    companyId,
    search,
    dateFrom,
    dateTo,
    limit: PAGE_SIZE,
    offset: (page - 1) * PAGE_SIZE,
  }

  const [satFiles, total, accounts, companies, stats] = await Promise.all([
    satFileRepository.getByOrganization(
      organizationId,
      queryOptions,
      pendingRows
    ),
    satFileRepository.countByOrganization(
      organizationId,
      queryOptions,
      pendingRows
    ),
    accountsRepository.getAllByOrganization(organizationId),
    companyRepository.getByOrganization(organizationId),
    satFileRepository.getCategorizeStats(organizationId),
  ])

  return {
    satFiles,
    accounts,
    companies,
    stats,
    status,
    total,
    page,
    pageSize: PAGE_SIZE,
  }
}

export async function action({ request }: Route.ActionArgs) {
  const session = await requireAuth(request)

  if (!session.session.activeOrganizationId) {
    return { error: 'No organization selected' }
  }

  const organizationId = session.session.activeOrganizationId
  const formData = await request.formData()
  const actionType = formData.get('_action')

  if (actionType === 'upload') {
    const file = formData.get('file') as File | null
    const companyId = formData.get('companyId') as string | null
    const invoiceTypeRaw = formData.get('invoiceType') as string | null

    if (!file || file.size === 0) {
      return { error: 'No file provided' }
    }

    if (!companyId) {
      return { error: 'Please select a company' }
    }

    const invoiceTypeParsed = invoiceTypeSchema.safeParse(invoiceTypeRaw)
    if (!invoiceTypeParsed.success) {
      return { error: 'Please select an invoice type' }
    }

    const result = await uploadSatFileAction(
      file,
      organizationId,
      companyId,
      invoiceTypeParsed.data
    )

    if (!result.success) {
      return {
        error: 'Failed to upload file',
        details: result.errors,
      }
    }

    // Build message based on what happened
    const messageParts: string[] = []
    if (result.inserted > 0) {
      messageParts.push(`${result.inserted} new records inserted`)
    }
    if (result.updated > 0) {
      messageParts.push(`${result.updated} existing records updated`)
    }
    if (result.skipped > 0) {
      messageParts.push(`${result.skipped} duplicates skipped`)
    }

    const message =
      messageParts.length > 0
        ? `Successfully processed: ${messageParts.join(', ')}`
        : 'No records were processed'

    return {
      success: true,
      message,
      inserted: result.inserted,
      updated: result.updated,
      skipped: result.skipped,
      totalRows: result.totalRows,
      errors: result.errors,
    }
  }

  if (actionType === 'updateAccount') {
    const satFileId = formData.get('satFileId') as string
    const accountingAccountId = formData.get('accountingAccountId') as string
    const itemTypeRaw = formData.get('itemType') as string | null
    const itemType =
      itemTypeRaw === 'goods' || itemTypeRaw === 'services' ? itemTypeRaw : null

    if (!satFileId) {
      return { error: 'SAT file ID is required' }
    }

    // If no account selected, just clear it (no journal entry creation)
    if (!accountingAccountId) {
      await satFileRepository.updateAccountingAccount(satFileId, null, itemType)
      return { success: true, message: 'Account removed' }
    }

    // Process the SAT record - this creates/updates the journal entry
    const result = await processSatRecordAction({
      satFileId,
      accountingAccountId,
      organizationId,
      itemType,
    })

    if (!result.success) {
      return { error: result.error }
    }

    return {
      success: true,
      message: result.isUpdate
        ? 'Journal entry updated'
        : 'Journal entry created',
      journalEntryId: result.journalEntry?.id,
      invoiceId: result.invoiceId,
    }
  }

  return { error: 'Unknown action' }
}

export default function SATProcessorIndex({
  loaderData,
  actionData,
}: Route.ComponentProps) {
  const { satFiles, accounts, companies, status, total, page, pageSize } =
    loaderData
  const [searchParams, setSearchParams] = useSearchParams()
  const [selectedRow, setSelectedRow] = useState<SatFile | null>(null)
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleRowSelectionChange = useCallback((selectedRows: SatFile[]) => {
    setSelectedRow(selectedRows.length > 0 ? selectedRows[0] : null)
  }, [])

  const handleRowClick = useCallback((row: SatFile) => {
    setSelectedRow((prev) => (prev?.id === row.id ? null : row))
  }, [])

  const handleUploadSuccess = useCallback(() => {
    setIsUploadDialogOpen(false)
  }, [])

  // Sync selectedRow when satFiles updates (e.g., after account update action)
  useEffect(() => {
    if (selectedRow) {
      const updatedRow = satFiles.find((file) => file.id === selectedRow.id)
      if (updatedRow && updatedRow !== selectedRow) {
        setSelectedRow(updatedRow)
      }
    }
  }, [satFiles, selectedRow])

  const updateParam = useCallback(
    (key: string, value: string | null) => {
      const p = new URLSearchParams(searchParams)
      if (value) p.set(key, value)
      else p.delete(key)
      p.delete('page') // reset to page 1 on filter change
      setSearchParams(p)
    },
    [searchParams, setSearchParams]
  )

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (searchTimeout.current) clearTimeout(searchTimeout.current)
      searchTimeout.current = setTimeout(() => {
        updateParam('search', e.target.value || null)
      }, 400)
    },
    [updateParam]
  )

  const handlePaginationChange = useCallback(
    (
      updater: PaginationState | ((prev: PaginationState) => PaginationState)
    ) => {
      const current = { pageIndex: page - 1, pageSize }
      const next = typeof updater === 'function' ? updater(current) : updater
      const p = new URLSearchParams(searchParams)
      p.set('page', String(next.pageIndex + 1))
      setSearchParams(p)
    },
    [page, pageSize, searchParams, setSearchParams]
  )

  const pagination = useMemo<PaginationState>(
    () => ({ pageIndex: page - 1, pageSize }),
    [page, pageSize]
  )

  const pageCount = Math.ceil(total / pageSize)

  const handleExportCsv = useCallback(() => {
    const headers = [
      'Fecha',
      'Tipo',
      'Serie',
      'Número',
      'NIT Emisor',
      'Emisor',
      'Total',
      'IVA',
      'Estado',
    ]
    const rows = satFiles.map((f) => [
      f.date ?? '',
      f.dteType ?? '',
      f.serie ?? '',
      f.dteNumber ?? '',
      f.emitterNit ?? '',
      f.emitterName ?? '',
      f.total ?? '',
      f.iva ?? '',
      f.accountingAccountId ? 'Asignada' : 'Pendiente',
    ])
    const csv = [headers, ...rows]
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))
      .join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `sat-invoices-page-${page}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }, [satFiles, page])

  return (
    <div className='flex flex-1 overflow-hidden'>
      <div className='flex flex-1 flex-col overflow-hidden p-6'>
        {/* Header */}
        <div className='mb-4 flex items-center justify-between'>
          <div className='flex items-center gap-2'>
            <h2 className='text-lg font-bold'>Facturas SAT</h2>
            <span className='bg-muted text-muted-foreground rounded px-2 text-sm'>
              {total} registros
            </span>
          </div>
          <div className='flex items-center gap-2'>
            <Select
              value={searchParams.get('companyId') ?? 'all'}
              onValueChange={(v) =>
                updateParam('companyId', v === 'all' ? null : v)
              }
            >
              <SelectTrigger className='w-48'>
                <SelectValue placeholder='Todas las empresas' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>Todas las empresas</SelectItem>
                {companies.map((company) => (
                  <SelectItem key={company.id} value={company.id}>
                    {company.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button variant='outline' onClick={handleExportCsv}>
              <Download className='mr-2 h-4 w-4' />
              Exportar CSV
            </Button>

            <Dialog
              open={isUploadDialogOpen}
              onOpenChange={setIsUploadDialogOpen}
            >
              <DialogTrigger asChild>
                <Button>
                  <Upload className='mr-2 h-4 w-4' />
                  Subir archivo SAT
                </Button>
              </DialogTrigger>
              <DialogContent className='sm:max-w-2xl'>
                <DialogHeader>
                  <DialogTitle>Subir exportación SAT</DialogTitle>
                </DialogHeader>
                <UploadDropzone
                  companies={companies}
                  onSuccess={handleUploadSuccess}
                />
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Filters row */}
        <div className='mb-3 flex flex-wrap items-center gap-2'>
          <input
            type='search'
            placeholder='Buscar por NIT, nombre, serie...'
            defaultValue={searchParams.get('search') ?? ''}
            onChange={handleSearchChange}
            className='border-input bg-background h-9 w-64 rounded-md border px-3 text-sm'
          />
          <input
            type='date'
            value={searchParams.get('dateFrom') ?? ''}
            onChange={(e) => updateParam('dateFrom', e.target.value || null)}
            className='border-input bg-background h-9 rounded-md border px-3 text-sm'
          />
          <span className='text-muted-foreground text-sm'>a</span>
          <input
            type='date'
            value={searchParams.get('dateTo') ?? ''}
            onChange={(e) => updateParam('dateTo', e.target.value || null)}
            className='border-input bg-background h-9 rounded-md border px-3 text-sm'
          />
          {(searchParams.get('dateFrom') ||
            searchParams.get('dateTo') ||
            searchParams.get('search')) && (
            <Button
              variant='ghost'
              size='sm'
              onClick={() => {
                const p = new URLSearchParams(searchParams)
                p.delete('dateFrom')
                p.delete('dateTo')
                p.delete('search')
                p.delete('page')
                setSearchParams(p)
              }}
            >
              Limpiar filtros
            </Button>
          )}
        </div>

        {actionData && 'success' in actionData && actionData.success && (
          <div className='mb-4 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700 dark:border-green-900 dark:bg-green-950/30 dark:text-green-400'>
            {'message' in actionData && actionData.message}
          </div>
        )}

        {actionData && 'error' in actionData && actionData.error && (
          <div className='rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400'>
            {actionData.error}
          </div>
        )}

        <Tabs
          value={status}
          onValueChange={(v) => updateParam('status', v)}
          className='mb-2'
        >
          <TabsList>
            <TabsTrigger value='assigned'>Asignadas</TabsTrigger>
            <TabsTrigger value='pending'>Pendientes</TabsTrigger>
            <TabsTrigger value='all'>Todas</TabsTrigger>
          </TabsList>
        </Tabs>

        <DataTable
          columns={SatFileColumns}
          data={satFiles}
          enableRowSelection
          onRowSelectionChange={handleRowSelectionChange}
          onRowClick={handleRowClick}
          manualPagination
          pageCount={pageCount}
          pagination={pagination}
          onPaginationChange={handlePaginationChange}
        />
      </div>

      <Drawer
        open={!!selectedRow}
        onOpenChange={(open) => {
          if (!open) setSelectedRow(null)
        }}
        direction='right'
      >
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Invoice Details</DrawerTitle>
          </DrawerHeader>
          <div className='overflow-auto p-4'>
            <SelectedRowDetails selectedRow={selectedRow} accounts={accounts} />
            <ProTipCard />
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  )
}
