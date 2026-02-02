import {
  ChevronLeftIcon,
  ChevronRightIcon,
  DownloadIcon,
  PlayIcon,
  SlidersHorizontalIcon,
} from 'lucide-react'
import { useEffect, useState } from 'react'
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
  generateReportSchema,
  exportReportSchema,
} from '~/features/reports/schemas'
import {
  generateJournalReportAction,
  exportJournalReportAction,
  type GenerateReportResult,
  type ExportReportResult,
} from '~/features/reports/server/actions/journal.entry.action'
import { requireAuth } from '~/server/auth/session.server'
import type { Route } from './+types/index'

type ActionResult =
  | GenerateReportResult
  | ExportReportResult
  | { success: false; error: string }

export async function action({ request }: Route.ActionArgs) {
  const session = await requireAuth(request)
  const organizationId = session.session.activeOrganizationId

  if (!organizationId) {
    return { success: false, error: 'No organization selected' } as const
  }

  const formData = await request.formData()
  const actionType = formData.get('_action')

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

    // Currently only journal-entry report is implemented
    if (result.data.reportType === 'journal-entry') {
      return await generateJournalReportAction(organizationId, result.data)
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

    // Currently only journal-entry report is implemented
    if (result.data.reportType === 'journal-entry') {
      return await exportJournalReportAction(organizationId, result.data)
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
      selectedCompanyId: undefined,
      selectedPartnerId: undefined,
      selectedReportType: 'journal-entry',
      datePreset: 'today',
    }
  }

  const url = new URL(request.url)
  const companyId = url.searchParams.get('companyId') || undefined
  const partnerId = url.searchParams.get('partnerId') || undefined
  const reportType = url.searchParams.get('reportType') || 'journal-entry'
  const datePreset = url.searchParams.get('datePreset') || 'today'

  const [companies, businessPartners] = await Promise.all([
    companyRepository.getByOrganization(organizationId),
    businessPartnersRepository.getAllByOrganization(organizationId),
  ])

  return {
    companies,
    businessPartners,
    selectedCompanyId: companyId,
    selectedPartnerId: partnerId,
    selectedReportType: reportType,
    datePreset,
  }
}

// Sample data for the preview table when no report is generated
const sampleData = [
  {
    id: '1',
    date: 'Oct 12, 2023',
    refNo: 'JRN-2023-0892',
    accountName: 'Accounts Receivable',
    description: 'Invoice #4521 - Service Provision',
    debit: 1250.0,
    credit: 0.0,
  },
  {
    id: '2',
    date: 'Oct 12, 2023',
    refNo: 'JRN-2023-0892',
    accountName: 'Sales Revenue',
    description: 'Invoice #4521 - Service Provision',
    debit: 0.0,
    credit: 1250.0,
  },
  {
    id: '3',
    date: 'Oct 14, 2023',
    refNo: 'JRN-2023-0895',
    accountName: 'Office Supplies',
    description: 'Stationery restock',
    debit: 342.15,
    credit: 0.0,
  },
  {
    id: '4',
    date: 'Oct 14, 2023',
    refNo: 'JRN-2023-0895',
    accountName: 'Petty Cash',
    description: 'Stationery restock',
    debit: 0.0,
    credit: 342.15,
  },
  {
    id: '5',
    date: 'Oct 15, 2023',
    refNo: 'JRN-2023-0901',
    accountName: 'Consulting Fees',
    description: 'Strategic Review - Project Alpha',
    debit: 5000.0,
    credit: 0.0,
  },
]

const reportTypes = [
  { value: 'journal-entry', label: 'Journal Entry' },
  { value: 'sales-ledger', label: 'Sales Ledger' },
  { value: 'purchase-ledger', label: 'Purchase Ledger' },
  { value: 'general-ledger', label: 'General Ledger' },
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
    selectedCompanyId,
    selectedPartnerId,
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

  // Update date range when preset changes
  useEffect(() => {
    const { from, to } = getDateRangeFromPreset(datePreset)
    setDateRange({ from, to })
  }, [datePreset])

  // Handle CSV download when export completes
  useEffect(() => {
    if (
      exportFetcher.data &&
      'export' in exportFetcher.data &&
      exportFetcher.data.export
    ) {
      const { csvContent, filename } = exportFetcher.data.export
      const blob = new Blob([csvContent], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }
  }, [exportFetcher.data])

  // Determine if we have live data
  const hasLiveData =
    generateFetcher.data &&
    'data' in generateFetcher.data &&
    generateFetcher.data.success

  // Get display data
  const displayData = hasLiveData
    ? (generateFetcher.data as GenerateReportResult).data
    : sampleData

  // Get pagination info
  const totalRows = hasLiveData
    ? (generateFetcher.data as GenerateReportResult).total
    : sampleData.length
  const totalPages = hasLiveData
    ? (generateFetcher.data as GenerateReportResult).totalPages
    : 1
  const pageSize = hasLiveData
    ? (generateFetcher.data as GenerateReportResult).pageSize
    : sampleData.length

  // Calculate page totals (for current page)
  const pageTotals = displayData.reduce(
    (acc, row) => ({
      debit: acc.debit + row.debit,
      credit: acc.credit + row.credit,
    }),
    { debit: 0, credit: 0 }
  )

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

  const handleGenerateReport = (page = 1) => {
    setCurrentPage(page)
    const formData = new FormData()
    formData.set('_action', 'generate')
    formData.set('reportType', selectedReportType)
    if (selectedCompanyId) formData.set('companyId', selectedCompanyId)
    if (dateRange?.from) formData.set('dateFrom', dateRange.from.toISOString())
    if (dateRange?.to) formData.set('dateTo', dateRange.to.toISOString())
    formData.set('page', String(page))
    formData.set('pageSize', '20')

    generateFetcher.submit(formData, { method: 'post' })
  }

  const handleExport = () => {
    const formData = new FormData()
    formData.set('_action', 'export')
    formData.set('reportType', selectedReportType)
    if (selectedCompanyId) formData.set('companyId', selectedCompanyId)
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

  // Calculate row range for display
  const startRow = hasLiveData ? (currentPage - 1) * pageSize + 1 : 1
  const endRow = hasLiveData
    ? Math.min(currentPage * pageSize, totalRows)
    : sampleData.length

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

              {/* Company / Branch */}
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
            </div>

            {/* Business Partner Filter */}
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

      {/* Live Preview Section */}
      <Card>
        <CardHeader>
          <div className='flex flex-wrap items-center justify-between gap-4'>
            <div className='flex items-center gap-3'>
              <h3 className='text-lg font-semibold'>Live Preview</h3>
              <Badge
                variant='secondary'
                className={
                  hasLiveData
                    ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                    : 'bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300'
                }
              >
                {hasLiveData ? 'LIVE DATA' : 'SAMPLE DATA'}
              </Badge>
            </div>
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
                  disabled={!hasLiveData || currentPage <= 1 || isGenerating}
                >
                  <ChevronLeftIcon className='size-4' />
                </Button>
                <Button
                  variant='outline'
                  size='icon'
                  className='size-8'
                  onClick={handleNextPage}
                  disabled={
                    !hasLiveData || currentPage >= totalPages || isGenerating
                  }
                >
                  <ChevronRightIcon className='size-4' />
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className='text-primary font-semibold'>
                  DATE
                </TableHead>
                <TableHead className='text-primary font-semibold'>
                  REF NO
                </TableHead>
                <TableHead className='text-primary font-semibold'>
                  ACCOUNT NAME
                </TableHead>
                <TableHead className='text-primary font-semibold'>
                  DESCRIPTION
                </TableHead>
                <TableHead className='text-primary text-right font-semibold'>
                  DEBIT
                </TableHead>
                <TableHead className='text-primary text-right font-semibold'>
                  CREDIT
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className='h-24 text-center'>
                    No data available. Click &quot;Generate Report&quot; to load
                    data.
                  </TableCell>
                </TableRow>
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
          </Table>
        </CardContent>
      </Card>
    </>
  )
}
