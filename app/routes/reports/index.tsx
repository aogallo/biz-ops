import {
  ChevronLeftIcon,
  ChevronRightIcon,
  DownloadIcon,
  PlayIcon,
  SlidersHorizontalIcon,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { DateRange } from 'react-day-picker'
import { useFetcher, useSearchParams } from 'react-router'
import TitleAndActions from '~/components/TitleAndActions'
import TitleAndActionsBody from '~/components/TitleAndActionsBody'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Calendar } from '~/components/ui/calendar'
import { Card, CardContent, CardFooter, CardHeader } from '~/components/ui/card'
import { Combobox } from '~/components/ui/combobox'
import { Label } from '~/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '~/components/ui/table'
import { ToggleGroup, ToggleGroupItem } from '~/components/ui/toggle-group'
import { businessPartnersRepository } from '~/features/business-partners/server/repository'
import { companyRepository } from '~/features/company/server/repository/company.repository'
import {
  exportReportSchema,
  generateReportSchema,
} from '~/features/reports/schemas'
import {
  exportJournalReportAction,
  generateJournalReportAction,
  type ExportReportResult,
  type GenerateReportResult,
} from '~/features/reports/server/actions/journal.entry.action'
import {
  exportAppointmentReportAction,
  generateAppointmentReportAction,
  type AppointmentReportResult,
  type AppointmentExportResult,
} from '~/features/reports/server/actions/appointment.report.action'
import {
  generateSalesLedgerAction,
  generatePurchaseLedgerAction,
  exportSalesLedgerAction,
  exportPurchaseLedgerAction,
} from '~/features/reports/server/actions/ledger.report.action'
import type {
  GenerateLedgerReportResult,
  ExportLedgerReportResult,
} from '~/features/reports/lib/ledger-pdf-types'
import { LedgerReportTable } from '~/features/reports/components/LedgerReportTable'
import {
  generateGeneralLedgerAction,
  exportGeneralLedgerAction,
} from '~/features/reports/server/actions/general-ledger.report.action'
import type {
  GenerateGeneralLedgerResult,
  ExportGeneralLedgerResult,
} from '~/features/reports/lib/general-ledger-types'
import { GeneralLedgerTable } from '~/features/reports/components/GeneralLedgerTable'
import { eq } from 'drizzle-orm'
import { db } from '~/server/db'
import { memberModel, userModel } from '~/server/db/schemas/auth'
import { requireAuth } from '~/server/auth/session.server'
import type { Route } from './+types/index'

type ActionResult =
  | GenerateReportResult
  | ExportReportResult
  | AppointmentReportResult
  | AppointmentExportResult
  | GenerateLedgerReportResult
  | ExportLedgerReportResult
  | GenerateGeneralLedgerResult
  | ExportGeneralLedgerResult
  | { success: false; error: string }

export async function action({ request }: Route.ActionArgs) {
  const session = await requireAuth(request)
  const organizationId = session.session.activeOrganizationId

  console.log('[Reports Action] organizationId:', organizationId)

  if (!organizationId) {
    return { success: false, error: 'No organization selected' } as const
  }

  const formData = await request.formData()
  const actionType = formData.get('_action')

  console.log('[Reports Action] actionType:', actionType)
  console.log(
    '[Reports Action] formData entries:',
    Object.fromEntries(formData.entries())
  )

  if (actionType === 'generate') {
    const result = generateReportSchema.safeParse({
      _action: formData.get('_action'),
      reportType: formData.get('reportType'),
      companyId: formData.get('companyId') || undefined,
      dateFrom: formData.get('dateFrom') || undefined,
      dateTo: formData.get('dateTo') || undefined,
      page: formData.get('page') || 1,
      pageSize: formData.get('pageSize') || 20,
    })

    if (!result.success) {
      return {
        success: false,
        error: 'Validation failed: ' + result.error.message,
      } as const
    }

    if (result.data.reportType === 'journal-entry') {
      try {
        const reportResult = await generateJournalReportAction(
          organizationId,
          result.data
        )
        console.log('[Reports Action] Generate result:', {
          total: reportResult.total,
          dataLength: reportResult.data.length,
        })
        return reportResult
      } catch (error) {
        console.error('[Reports Action] Generate error:', error)
        return { success: false, error: String(error) } as const
      }
    }

    if (result.data.reportType === 'sales-ledger') {
      try {
        const reportResult = await generateSalesLedgerAction(organizationId, result.data)
        return reportResult
      } catch (error) {
        console.error('[Reports Action] Generate sales ledger error:', error)
        return { success: false, error: String(error) } as const
      }
    }

    if (result.data.reportType === 'purchase-ledger') {
      try {
        const reportResult = await generatePurchaseLedgerAction(organizationId, result.data)
        return reportResult
      } catch (error) {
        console.error('[Reports Action] Generate purchase ledger error:', error)
        return { success: false, error: String(error) } as const
      }
    }

    if (result.data.reportType === 'general-ledger') {
      try {
        const reportResult = await generateGeneralLedgerAction(organizationId, result.data)
        return reportResult
      } catch (error) {
        console.error('[Reports Action] Generate general ledger error:', error)
        return { success: false, error: String(error) } as const
      }
    }

    if (result.data.reportType === 'appointment-occupancy') {
      try {
        const staffId = formData.get('staffId') as string | null
        const reportResult = await generateAppointmentReportAction(
          organizationId,
          {
            dateFrom: result.data.dateFrom,
            dateTo: result.data.dateTo,
            staffId: staffId || undefined,
            page: result.data.page,
            pageSize: result.data.pageSize,
          }
        )
        return reportResult
      } catch (error) {
        console.error('[Reports Action] Generate appointment error:', error)
        return { success: false, error: String(error) } as const
      }
    }

    return { success: false, error: 'Report type not implemented' } as const
  }

  if (actionType === 'export') {
    const result = exportReportSchema.safeParse({
      _action: formData.get('_action'),
      reportType: formData.get('reportType'),
      companyId: formData.get('companyId') || undefined,
      dateFrom: formData.get('dateFrom') || undefined,
      dateTo: formData.get('dateTo') || undefined,
    })

    if (!result.success) {
      return {
        success: false,
        error: 'Validation failed: ' + result.error.message,
      } as const
    }

    if (result.data.reportType === 'journal-entry') {
      try {
        const exportResult = await exportJournalReportAction(
          organizationId,
          result.data
        )
        console.log('[Reports Action] Export result:', {
          filename: exportResult.export.filename,
          contentLength: exportResult.export.pdfBase64.length,
        })
        return exportResult
      } catch (error) {
        console.error('[Reports Action] Export error:', error)
        return { success: false, error: String(error) } as const
      }
    }

    if (result.data.reportType === 'sales-ledger') {
      try {
        const exportResult = await exportSalesLedgerAction(organizationId, result.data)
        return exportResult
      } catch (error) {
        console.error('[Reports Action] Export sales ledger error:', error)
        return { success: false, error: String(error) } as const
      }
    }

    if (result.data.reportType === 'purchase-ledger') {
      try {
        const exportResult = await exportPurchaseLedgerAction(organizationId, result.data)
        return exportResult
      } catch (error) {
        console.error('[Reports Action] Export purchase ledger error:', error)
        return { success: false, error: String(error) } as const
      }
    }

    if (result.data.reportType === 'general-ledger') {
      try {
        const exportResult = await exportGeneralLedgerAction(organizationId, result.data)
        return exportResult
      } catch (error) {
        console.error('[Reports Action] Export general ledger error:', error)
        return { success: false, error: String(error) } as const
      }
    }

    if (result.data.reportType === 'appointment-occupancy') {
      try {
        const staffId = formData.get('staffId') as string | null
        const exportResult = await exportAppointmentReportAction(
          organizationId,
          {
            dateFrom: result.data.dateFrom,
            dateTo: result.data.dateTo,
            staffId: staffId || undefined,
          }
        )
        return exportResult
      } catch (error) {
        console.error('[Reports Action] Export appointment error:', error)
        return { success: false, error: String(error) } as const
      }
    }

    return { success: false, error: 'Report type not implemented' } as const
  }

  return { success: false, error: 'Invalid action' } as const
}

export async function loader({ request }: Route.LoaderArgs) {
  const session = await requireAuth(request)
  const organizationId = session.session.activeOrganizationId

  if (!organizationId) {
    return {
      companies: [],
      businessPartners: [],
      staff: [],
      selectedCompanyId: undefined,
      selectedPartnerId: undefined,
      selectedStaffId: undefined,
      selectedReportType: 'journal-entry',
      datePreset: 'today',
    }
  }

  const url = new URL(request.url)
  const companyId = url.searchParams.get('companyId') || undefined
  const partnerId = url.searchParams.get('partnerId') || undefined
  const staffId = url.searchParams.get('staffId') || undefined
  const reportType = url.searchParams.get('reportType') || 'journal-entry'
  const datePreset = url.searchParams.get('datePreset') || 'today'

  const [companies, businessPartners, staff] = await Promise.all([
    companyRepository.getByOrganization(organizationId),
    businessPartnersRepository.getAllByOrganization(organizationId),
    db
      .select({ id: memberModel.id, name: userModel.name })
      .from(memberModel)
      .innerJoin(userModel, eq(memberModel.userId, userModel.id))
      .where(eq(memberModel.organizationId, organizationId)),
  ])

  return {
    companies,
    businessPartners,
    staff,
    selectedCompanyId: companyId,
    selectedPartnerId: partnerId,
    selectedStaffId: staffId,
    selectedReportType: reportType,
    datePreset,
  }
}

const reportTypes = [
  { value: 'journal-entry', label: 'Journal Entry' },
  { value: 'sales-ledger', label: 'Sales Ledger' },
  { value: 'purchase-ledger', label: 'Purchase Ledger' },
  { value: 'general-ledger', label: 'General Ledger' },
  { value: 'appointment-occupancy', label: 'Appointment & Occupancy' },
]

const datePresets = [
  { value: 'today', label: 'Today' },
  { value: 'this-month', label: 'This Month' },
  { value: 'last-quarter', label: 'Last Quarter' },
  { value: 'fiscal-year', label: 'Fiscal Year' },
]

function getDateRangeFromPreset(preset: string): { from: Date; to: Date } {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  switch (preset) {
    case 'today':
      return { from: today, to: today }
    case 'this-month':
      return {
        from: new Date(now.getFullYear(), now.getMonth(), 1),
        to: new Date(now.getFullYear(), now.getMonth() + 1, 0),
      }
    case 'last-quarter': {
      const quarterStart = new Date(
        now.getFullYear(),
        Math.floor(now.getMonth() / 3) * 3 - 3,
        1
      )
      const quarterEnd = new Date(
        now.getFullYear(),
        Math.floor(now.getMonth() / 3) * 3,
        0
      )
      return { from: quarterStart, to: quarterEnd }
    }
    case 'fiscal-year':
      return {
        from: new Date(now.getFullYear(), 0, 1),
        to: new Date(now.getFullYear(), 11, 31),
      }
    default:
      return { from: today, to: today }
  }
}

export default function JournalReport({ loaderData }: Route.ComponentProps) {
  const {
    companies,
    businessPartners,
    staff,
    selectedCompanyId,
    selectedPartnerId,
    selectedStaffId,
    selectedReportType,
    datePreset,
  } = loaderData
  const [searchParams, setSearchParams] = useSearchParams()

  const generateFetcher = useFetcher<ActionResult>()
  const exportFetcher = useFetcher<ActionResult>()

  // Initialize date range from preset
  const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
    const { from, to } = getDateRangeFromPreset(datePreset)
    return { from, to }
  })

  // Current page state for pagination
  const [currentPage, setCurrentPage] = useState(1)

  // Track last downloaded export to prevent duplicate downloads
  const lastExportRef = useRef<string | null>(null)

  // Update date range when preset changes
  useEffect(() => {
    const { from, to } = getDateRangeFromPreset(datePreset)
    setDateRange({ from, to })
  }, [datePreset])

  // Handle file download when export completes
  useEffect(() => {
    if (
      exportFetcher.state === 'idle' &&
      exportFetcher.data &&
      'export' in exportFetcher.data &&
      exportFetcher.data.export
    ) {
      const exportData = exportFetcher.data.export as { pdfBase64?: string; csvBase64?: string; filename: string }
      const base64Content = exportData.pdfBase64 || exportData.csvBase64
      if (!base64Content) return

      const { filename } = exportData
      const exportKey = `${filename}-${base64Content.length}`
      if (lastExportRef.current === exportKey) return
      lastExportRef.current = exportKey

      const isCSV = !!exportData.csvBase64
      const mimeType = isCSV ? 'text/csv' : 'application/pdf'

      const binaryString = atob(base64Content)
      const bytes = new Uint8Array(binaryString.length)
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i)
      }

      const blob = new Blob([bytes], { type: mimeType })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }
  }, [exportFetcher.state, exportFetcher.data])

  // Report type flags
  const isAppointmentReport = selectedReportType === 'appointment-occupancy'
  const isLedgerReport = selectedReportType === 'sales-ledger' || selectedReportType === 'purchase-ledger'
  const isGeneralLedger = selectedReportType === 'general-ledger'

  // Determine if we have generated data
  const hasGeneratedData =
    generateFetcher.data &&
    'data' in generateFetcher.data &&
    generateFetcher.data.success

  // Check if report has been generated (even with no results)
  const hasRunReport = generateFetcher.data !== undefined

  // General ledger report data (detect via reportMonth field)
  const generalLedgerData = hasGeneratedData && 'reportMonth' in (generateFetcher.data as object)
    ? (generateFetcher.data as GenerateGeneralLedgerResult)
    : null

  // Ledger report data (has grandTotals but NOT reportMonth)
  const ledgerData = hasGeneratedData && !generalLedgerData && 'grandTotals' in (generateFetcher.data as object)
    ? (generateFetcher.data as GenerateLedgerReportResult)
    : null

  // Get display data (journal or appointment — ledger/general-ledger use their own components)
  const displayData = hasGeneratedData && !ledgerData && !generalLedgerData
    ? (generateFetcher.data as GenerateReportResult).data
    : []

  // Get pagination info (works for all report types with total/totalPages/pageSize)
  const paginationSource = hasGeneratedData ? (generateFetcher.data as { total?: number; totalPages?: number; pageSize?: number }) : null
  const totalRows = paginationSource?.total ?? 0
  const totalPages = paginationSource?.totalPages ?? 1
  const pageSize = paginationSource?.pageSize ?? 20

  // Calculate page totals (for journal entry reports only)
  const pageTotals = !isLedgerReport && !isGeneralLedger ? displayData.reduce(
    (acc, row) => ({
      debit: acc.debit + row.debit,
      credit: acc.credit + row.credit,
    }),
    { debit: 0, credit: 0 }
  ) : { debit: 0, credit: 0 }

  const companyOptions = companies.map((company) => ({
    value: company.id,
    label: company.name,
  }))

  const partnerOptions = [
    { value: 'all', label: 'All Partners' },
    ...businessPartners.map((partner) => ({
      value: partner.id,
      label: partner.name,
    })),
  ]

  const staffOptions = [
    { value: 'all', label: 'All Staff' },
    ...staff.map((s) => ({
      value: s.id,
      label: s.name ?? 'Unknown',
    })),
  ]

  // Appointment report data
  const appointmentData = hasGeneratedData && 'summary' in (generateFetcher.data as object)
    ? (generateFetcher.data as AppointmentReportResult)
    : null

  const updateSearchParam = (key: string, value: string | undefined) => {
    const params = new URLSearchParams(searchParams)
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    setSearchParams(params)
  }

  const handleCompanyChange = (value: string) => {
    updateSearchParam('companyId', value || undefined)
  }

  const handlePartnerChange = (value: string) => {
    updateSearchParam('partnerId', value === 'all' ? undefined : value)
  }

  const handleDatePresetChange = (value: string) => {
    if (value) {
      updateSearchParam('datePreset', value)
    }
  }

  const handleReportTypeChange = (value: string) => {
    updateSearchParam('reportType', value)
  }

  const handleStaffChange = (value: string) => {
    updateSearchParam('staffId', value === 'all' ? undefined : value)
  }

  const handleGenerateReport = (page = 1) => {
    setCurrentPage(page)
    const formData = new FormData()
    formData.set('_action', 'generate')
    formData.set('reportType', selectedReportType)
    if (selectedCompanyId) formData.set('companyId', selectedCompanyId)
    if (selectedStaffId) formData.set('staffId', selectedStaffId)
    if (dateRange?.from) formData.set('dateFrom', dateRange.from.toISOString())
    if (dateRange?.to) formData.set('dateTo', dateRange.to.toISOString())
    formData.set('page', String(page))
    formData.set('pageSize', '20')

    generateFetcher.submit(formData, { method: 'post' })
  }

  const handleExport = () => {
    lastExportRef.current = null

    const formData = new FormData()
    formData.set('_action', 'export')
    formData.set('reportType', selectedReportType)
    if (selectedCompanyId) formData.set('companyId', selectedCompanyId)
    if (selectedStaffId) formData.set('staffId', selectedStaffId)
    if (dateRange?.from) formData.set('dateFrom', dateRange.from.toISOString())
    if (dateRange?.to) formData.set('dateTo', dateRange.to.toISOString())

    exportFetcher.submit(formData, { method: 'post' })
  }

  const handlePrevPage = () => {
    if (currentPage > 1) {
      handleGenerateReport(currentPage - 1)
    }
  }

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      handleGenerateReport(currentPage + 1)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  const formatDateRange = () => {
    if (!dateRange?.from) return ''
    const fromStr = dateRange.from.toLocaleDateString('en-US', {
      month: 'short',
      day: '2-digit',
    })
    const toStr = dateRange.to
      ? dateRange.to.toLocaleDateString('en-US', {
          month: 'short',
          day: '2-digit',
        })
      : fromStr
    return `Range: ${fromStr} - ${toStr}`
  }

  const selectedReportLabel =
    reportTypes.find((r) => r.value === selectedReportType)?.label ||
    'Financial Report'

  const isGenerating = generateFetcher.state !== 'idle'
  const isExporting = exportFetcher.state !== 'idle'

  // Get error messages
  const generateError =
    generateFetcher.data && 'error' in generateFetcher.data
      ? generateFetcher.data.error
      : null
  const exportError =
    exportFetcher.data && 'error' in exportFetcher.data
      ? exportFetcher.data.error
      : null

  // Calculate row range for display
  const startRow = hasGeneratedData && totalRows > 0 ? (currentPage - 1) * pageSize + 1 : 0
  const endRow = hasGeneratedData
    ? Math.min(currentPage * pageSize, totalRows)
    : 0

  return (
    <>
      <TitleAndActions
        title={`${selectedReportLabel} Report`}
        subtitle='Configure your multi-tenant financial reporting and preview data.'
      >
        <TitleAndActionsBody>
          <Button
            variant='outline'
            onClick={handleExport}
            disabled={isExporting}
          >
            <DownloadIcon />
            {isExporting ? 'Exporting...' : 'Export'}
          </Button>
          <Button
            onClick={() => handleGenerateReport(1)}
            disabled={isGenerating}
          >
            <PlayIcon />
            {isGenerating ? 'Generating...' : 'Generate Report'}
          </Button>
        </TitleAndActionsBody>
      </TitleAndActions>

      {/* Error Messages */}
      {(generateError || exportError) && (
        <div className='mb-4 rounded-md border border-red-200 bg-red-50 p-4 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300'>
          {generateError && <p>Generate Error: {generateError}</p>}
          {exportError && <p>Export Error: {exportError}</p>}
        </div>
      )}

      {/* Configuration Section */}
      <section className='mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2'>
        {/* Report Configuration Card */}
        <Card>
          <CardHeader>
            <div className='flex items-center gap-2'>
              <SlidersHorizontalIcon className='text-muted-foreground size-5' />
              <h3 className='text-lg font-semibold'>Report Configuration</h3>
            </div>
          </CardHeader>
          <CardContent className='space-y-6'>
            {/* Report Type */}
            <div className='space-y-3'>
              <Label className='text-primary font-medium'>Report Type</Label>
              <Select
                value={selectedReportType}
                onValueChange={handleReportTypeChange}
              >
                <SelectTrigger className='w-full sm:w-[300px]'>
                  <SelectValue placeholder='Select report type' />
                </SelectTrigger>
                <SelectContent>
                  {reportTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className='grid grid-cols-1 gap-6 sm:grid-cols-2'>
              {/* Date Range Presets */}
              <div className='space-y-3'>
                <Label className='text-primary font-medium'>
                  Date Range Presets
                </Label>
                <ToggleGroup
                  type='single'
                  value={datePreset}
                  onValueChange={handleDatePresetChange}
                  className='flex flex-wrap gap-2'
                  variant='outline'
                >
                  {datePresets.map((preset) => (
                    <ToggleGroupItem
                      key={preset.value}
                      value={preset.value}
                      className='data-[state=on]:bg-primary data-[state=on]:text-primary-foreground'
                    >
                      {preset.label}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
              </div>

              {/* Company / Branch (hidden for appointment reports) */}
              {!isAppointmentReport && (
                <div className='space-y-3'>
                  <Label className='text-primary font-medium'>
                    Company / Branch
                  </Label>
                  <Combobox
                    options={companyOptions}
                    value={selectedCompanyId}
                    onValueChange={handleCompanyChange}
                    placeholder='Select a company...'
                    searchPlaceholder='Search companies...'
                    emptyMessage='No companies found.'
                  />
                </div>
              )}

              {/* Staff Filter (only for appointment reports) */}
              {isAppointmentReport && (
                <div className='space-y-3'>
                  <Label className='text-primary font-medium'>
                    Staff Member
                  </Label>
                  <Select
                    value={selectedStaffId || 'all'}
                    onValueChange={handleStaffChange}
                  >
                    <SelectTrigger className='w-full'>
                      <SelectValue placeholder='All Staff' />
                    </SelectTrigger>
                    <SelectContent>
                      {staffOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {/* Business Partner Filter (hidden for appointment reports) */}
            {!isAppointmentReport && (
              <div className='space-y-3'>
                <Label className='text-primary font-medium'>
                  Business Partner Filter
                </Label>
                <Select
                  value={selectedPartnerId || 'all'}
                  onValueChange={handlePartnerChange}
                >
                  <SelectTrigger className='w-full sm:w-[300px]'>
                    <SelectValue placeholder='All Partners' />
                  </SelectTrigger>
                  <SelectContent>
                    {partnerOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Calendar Card */}
        <Card className='flex flex-col'>
          <CardContent className='flex flex-1 items-center justify-center pt-6'>
            <Calendar
              mode='range'
              selected={dateRange}
              onSelect={setDateRange}
              numberOfMonths={1}
              className='rounded-lg'
            />
          </CardContent>
          <CardFooter className='justify-center pb-4'>
            <p className='text-muted-foreground text-sm'>{formatDateRange()}</p>
          </CardFooter>
        </Card>
      </section>

      {/* Report Preview Section */}
      <Card>
        <CardHeader>
          <div className='flex flex-wrap items-center justify-between gap-4'>
            <div className='flex items-center gap-3'>
              <h3 className='text-lg font-semibold'>Report Preview</h3>
              {hasGeneratedData && (
                <Badge
                  variant='secondary'
                  className='bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                >
                  {totalRows} RECORDS
                </Badge>
              )}
            </div>
            {hasGeneratedData && totalRows > 0 && (
              <div className='flex items-center gap-3'>
                <span className='text-muted-foreground text-sm'>
                  Rows: {startRow}-{endRow} of {totalRows.toLocaleString()}
                </span>
                <div className='flex gap-1'>
                  <Button
                    variant='outline'
                    size='icon'
                    className='size-8'
                    onClick={handlePrevPage}
                    disabled={currentPage <= 1 || isGenerating}
                  >
                    <ChevronLeftIcon className='size-4' />
                  </Button>
                  <Button
                    variant='outline'
                    size='icon'
                    className='size-8'
                    onClick={handleNextPage}
                    disabled={currentPage >= totalPages || isGenerating}
                  >
                    <ChevronRightIcon className='size-4' />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {/* Appointment Summary Stats */}
          {appointmentData && (
            <div className='mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4'>
              <div className='rounded-lg border p-3 text-center'>
                <p className='text-2xl font-bold'>{appointmentData.summary.totalAppointments}</p>
                <p className='text-xs text-muted-foreground'>Total</p>
              </div>
              <div className='rounded-lg border p-3 text-center'>
                <p className='text-2xl font-bold text-green-600'>{appointmentData.summary.completed}</p>
                <p className='text-xs text-muted-foreground'>Completed</p>
              </div>
              <div className='rounded-lg border p-3 text-center'>
                <p className='text-2xl font-bold text-red-600'>{appointmentData.summary.cancelled}</p>
                <p className='text-xs text-muted-foreground'>Cancelled</p>
              </div>
              <div className='rounded-lg border p-3 text-center'>
                <p className='text-2xl font-bold text-teal-600'>
                  {formatCurrency(appointmentData.summary.totalRevenue)}
                </p>
                <p className='text-xs text-muted-foreground'>Revenue</p>
              </div>
            </div>
          )}

          {isGeneralLedger ? (
            <GeneralLedgerTable
              data={generalLedgerData?.data ?? []}
              grandTotals={generalLedgerData?.grandTotals ?? {
                totalDebit: 0, totalCredit: 0,
                totalOpeningBalance: 0, totalClosingBalance: 0,
              }}
              reportMonth={generalLedgerData?.reportMonth ?? ''}
              hasRunReport={hasRunReport}
            />
          ) : isLedgerReport ? (
            <LedgerReportTable
              data={ledgerData?.data ?? []}
              grandTotals={ledgerData?.grandTotals ?? {
                localGravadosBienes: 0, localGravadosServicios: 0,
                localExentosBienes: 0, localExentosServicios: 0,
                importGravadosBienes: 0, importGravadosServicios: 0,
                importExentosBienes: 0, importExentosServicios: 0,
                ivaAmount: 0, totalDocumento: 0,
              }}
              totalDocuments={ledgerData?.totalDocuments ?? 0}
              reportType={selectedReportType as 'sales-ledger' | 'purchase-ledger'}
              hasRunReport={hasRunReport}
            />
          ) : (
          <Table>
            <TableHeader>
              <TableRow>
                {isAppointmentReport ? (
                  <>
                    <TableHead className='text-primary font-semibold'>DATE</TableHead>
                    <TableHead className='text-primary font-semibold'>TIME</TableHead>
                    <TableHead className='text-primary font-semibold'>STAFF</TableHead>
                    <TableHead className='text-primary font-semibold'>SERVICE</TableHead>
                    <TableHead className='text-primary font-semibold'>CLIENT</TableHead>
                    <TableHead className='text-primary font-semibold'>DURATION</TableHead>
                    <TableHead className='text-primary text-right font-semibold'>PRICE</TableHead>
                    <TableHead className='text-primary font-semibold'>STATUS</TableHead>
                  </>
                ) : (
                  <>
                    <TableHead className='text-primary font-semibold'>DATE</TableHead>
                    <TableHead className='text-primary font-semibold'>REF NO</TableHead>
                    <TableHead className='text-primary font-semibold'>ACCOUNT NAME</TableHead>
                    <TableHead className='text-primary font-semibold'>DESCRIPTION</TableHead>
                    <TableHead className='text-primary text-right font-semibold'>DEBIT</TableHead>
                    <TableHead className='text-primary text-right font-semibold'>CREDIT</TableHead>
                  </>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={isAppointmentReport ? 8 : 6} className='h-32 text-center'>
                    <div className='text-muted-foreground flex flex-col items-center gap-2'>
                      {!hasRunReport ? (
                        <>
                          <PlayIcon className='size-8 opacity-50' />
                          <p>Click &quot;Generate Report&quot; to load data</p>
                        </>
                      ) : (
                        <>
                          <p className='text-lg font-medium'>No data found</p>
                          <p className='text-sm'>
                            No records match the selected filters. Try adjusting the date range.
                          </p>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : isAppointmentReport ? (
                (displayData as unknown as AppointmentReportResult['data']).map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className='font-medium'>{row.date}</TableCell>
                    <TableCell>{row.startTime} - {row.endTime}</TableCell>
                    <TableCell>{row.staffName}</TableCell>
                    <TableCell>{row.serviceName}</TableCell>
                    <TableCell>{row.clientName}</TableCell>
                    <TableCell>{row.duration} min</TableCell>
                    <TableCell className='text-right'>
                      {row.price ? formatCurrency(Number(row.price)) : '-'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={
                        row.status === 'completed' ? 'secondary' :
                        row.status === 'cancelled' ? 'destructive' :
                        row.status === 'confirmed' ? 'default' : 'outline'
                      }>
                        {row.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                displayData.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className='font-medium'>{row.date}</TableCell>
                    <TableCell className='text-muted-foreground font-mono text-sm'>
                      {row.refNo}
                    </TableCell>
                    <TableCell>{row.accountName}</TableCell>
                    <TableCell className='max-w-[200px] truncate'>
                      {row.description}
                    </TableCell>
                    <TableCell className='text-right'>
                      {formatCurrency(row.debit)}
                    </TableCell>
                    <TableCell className='text-right'>
                      {formatCurrency(row.credit)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
            {displayData.length > 0 && !isAppointmentReport && (
              <TableFooter>
                <TableRow>
                  <TableCell colSpan={4} className='text-right font-semibold'>
                    PAGE TOTALS
                  </TableCell>
                  <TableCell className='text-right font-bold text-teal-600'>
                    {formatCurrency(pageTotals.debit)}
                  </TableCell>
                  <TableCell className='text-right font-bold text-teal-600'>
                    {formatCurrency(pageTotals.credit)}
                  </TableCell>
                </TableRow>
              </TableFooter>
            )}
          </Table>
          )}
        </CardContent>
      </Card>
    </>
  )
}
