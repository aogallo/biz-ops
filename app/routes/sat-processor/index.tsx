import { Search } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { useActionData, useSearchParams } from 'react-router'
import { DataTable } from '~/components/dataTable/DataTable'
import { Input } from '~/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'
import { accountsRepository } from '~/features/accounts/server/repository'
import { companyRepository } from '~/features/company/server/repository/company.repository'
import { SatFileColumns } from '~/features/sat-processor/components/Columns'
import { ProTipCard } from '~/features/sat-processor/components/ProTipCard'
import { SelectedRowDetails } from '~/features/sat-processor/components/SelectedRowDetails'
import { UploadDropzone } from '~/features/sat-processor/components/UploadDropzone'
import { invoiceTypeSchema } from '~/features/sat-processor/schemas'
import { processSatRecordAction } from '~/features/journal-entry/server/actions/process-sat-record.action'
import { uploadSatFileAction } from '~/features/sat-processor/server/actions/upload.action'
import { satFileRepository } from '~/features/sat-processor/server/repository/sat-file.repository'
import { requireAuth } from '~/server/auth/session.server'
import type { SatFile } from '~/server/db/schemas/sat-file'
import type { Route } from './+types'

export async function loader({ request }: Route.LoaderArgs) {
  const session = await requireAuth(request)
  const url = new URL(request.url)
  const search = url.searchParams.get('search') ?? undefined
  const companyId = url.searchParams.get('companyId') ?? undefined

  if (!session.session.activeOrganizationId) {
    return {
      satFiles: [],
      accounts: [],
      companies: [],
      stats: { total: 0, matched: 0, review: 0 },
    }
  }

  const organizationId = session.session.activeOrganizationId

  const [satFiles, accounts, companies, stats] = await Promise.all([
    satFileRepository.getByOrganization(organizationId, { search, companyId }),
    accountsRepository.getAllByOrganization(organizationId),
    companyRepository.getByOrganization(organizationId),
    satFileRepository.getCategorizeStats(organizationId),
  ])

  return { satFiles, accounts, companies, stats }
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
      console.error('upload errors', result.errors)
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

    if (!satFileId) {
      return { error: 'SAT file ID is required' }
    }

    // If no account selected, just clear it (no journal entry creation)
    if (!accountingAccountId) {
      const { satFileRepository } = await import(
        '~/features/sat-processor/server/repository/sat-file.repository'
      )
      await satFileRepository.updateAccountingAccount(satFileId, null)
      return { success: true, message: 'Account removed' }
    }

    // Process the SAT record - this creates/updates the journal entry
    const result = await processSatRecordAction({
      satFileId,
      accountingAccountId,
      organizationId,
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
}: Route.ComponentProps) {
  const { satFiles, accounts, companies } = loaderData
  const actionData = useActionData<typeof action>()
  const [searchParams, setSearchParams] = useSearchParams()
  const [selectedRow, setSelectedRow] = useState<SatFile | null>(null)

  const handleRowSelectionChange = useCallback((selectedRows: SatFile[]) => {
    setSelectedRow(selectedRows.length > 0 ? selectedRows[0] : null)
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

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    const newParams = new URLSearchParams(searchParams)
    if (value) {
      newParams.set('search', value)
    } else {
      newParams.delete('search')
    }
    setSearchParams(newParams)
  }

  const handleCompanyChange = (value: string) => {
    const newParams = new URLSearchParams(searchParams)
    if (value && value !== 'all') {
      newParams.set('companyId', value)
    } else {
      newParams.delete('companyId')
    }
    setSearchParams(newParams)
  }

  const currentMonth = new Date().toLocaleString('es-GT', {
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className='flex flex-1 gap-2 overflow-hidden'>
      <div className='flex-1 overflow-auto'>
        <div className='space-y-4'>
          <UploadDropzone companies={companies} />

          {actionData && 'error' in actionData && actionData.error && (
            <div className='rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400'>
              {actionData.error}
            </div>
          )}

          {actionData && 'success' in actionData && actionData.success && (
            <div className='rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700 dark:border-green-900 dark:bg-green-950/30 dark:text-green-400'>
              {'message' in actionData && actionData.message}
            </div>
          )}

          {/* <ProgressStats stats={stats} /> */}
        </div>

        <div className='flex flex-1 flex-col overflow-hidden p-6'>
          <div className='mb-4 flex items-center justify-between'>
            <div className='flex items-center gap-2'>
              <h2 className='text-lg font-bold'>Processed Invoices</h2>
              <span className='bg-muted text-muted-foreground rounded px-2 text-sm capitalize'>
                {currentMonth}
              </span>
            </div>
            <div className='flex items-center gap-2'>
              <Select
                value={searchParams.get('companyId') ?? 'all'}
                onValueChange={handleCompanyChange}
              >
                <SelectTrigger className='w-48'>
                  <SelectValue placeholder='All Companies' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>All Companies</SelectItem>
                  {companies.map((company) => (
                    <SelectItem key={company.id} value={company.id}>
                      {company.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className='relative'>
                <Search className='absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400' />
                <Input
                  placeholder='Search...'
                  className='w-64 pl-9'
                  value={searchParams.get('search') ?? ''}
                  onChange={handleSearchChange}
                />
              </div>
            </div>
          </div>
          <DataTable
            columns={SatFileColumns}
            data={satFiles}
            enableRowSelection
            onRowSelectionChange={handleRowSelectionChange}
          />
        </div>
      </div>

      <aside className='w-80 shrink-0 overflow-auto border-l p-6'>
        {/* <QuickActions /> */}
        {/* <div className='bg-border my-6 h-px' /> */}
        <SelectedRowDetails selectedRow={selectedRow} accounts={accounts} />
        <ProTipCard />
      </aside>
    </div>
  )
}
