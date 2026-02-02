import {
  journalEntryRepository,
  type ReportLineItem,
} from '~/features/journal-entry/server/repository'
import type { GenerateReportInput, ExportReportInput } from '../../schemas'

export interface GenerateReportResult {
  success: true
  data: ReportLineItem[]
  total: number
  totalDebit: number
  totalCredit: number
  page: number
  pageSize: number
  totalPages: number
}

export interface ExportReportResult {
  success: true
  export: {
    csvContent: string
    filename: string
  }
}

function parseDate(dateStr: string | undefined): Date | undefined {
  if (!dateStr) return undefined
  const date = new Date(dateStr)
  return isNaN(date.getTime()) ? undefined : date
}

export async function generateJournalReportAction(
  organizationId: string,
  input: Omit<GenerateReportInput, '_action'>
): Promise<GenerateReportResult> {
  const { companyId, dateFrom, dateTo, page, pageSize } = input
  const offset = (page - 1) * pageSize

  const result = await journalEntryRepository.getForReport(organizationId, {
    companyId,
    dateFrom: parseDate(dateFrom),
    dateTo: parseDate(dateTo),
    limit: pageSize,
    offset,
  })

  const totalPages = Math.ceil(result.total / pageSize)

  return {
    success: true,
    data: result.data,
    total: result.total,
    totalDebit: result.totalDebit,
    totalCredit: result.totalCredit,
    page,
    pageSize,
    totalPages,
  }
}

export async function exportJournalReportAction(
  organizationId: string,
  input: Omit<ExportReportInput, '_action'>
): Promise<ExportReportResult> {
  const { companyId, dateFrom, dateTo } = input

  const data = await journalEntryRepository.getAllForExport(organizationId, {
    companyId,
    dateFrom: parseDate(dateFrom),
    dateTo: parseDate(dateTo),
  })

  // Calculate totals
  const totalDebit = data.reduce((sum, row) => sum + row.debit, 0)
  const totalCredit = data.reduce((sum, row) => sum + row.credit, 0)

  // Generate CSV content
  const headers = ['Date', 'Ref No', 'Account Name', 'Description', 'Debit', 'Credit']
  const csvRows = [headers.join(',')]

  for (const row of data) {
    const escapedDescription = `"${(row.description || '').replace(/"/g, '""')}"`
    const escapedAccountName = `"${(row.accountName || '').replace(/"/g, '""')}"`
    csvRows.push(
      [
        row.date,
        row.refNo,
        escapedAccountName,
        escapedDescription,
        row.debit.toFixed(2),
        row.credit.toFixed(2),
      ].join(',')
    )
  }

  // Add totals row
  csvRows.push(['', '', '', 'TOTALS', totalDebit.toFixed(2), totalCredit.toFixed(2)].join(','))

  const csvContent = csvRows.join('\n')

  // Generate filename with date range
  const fromStr = dateFrom ? new Date(dateFrom).toISOString().split('T')[0] : 'all'
  const toStr = dateTo ? new Date(dateTo).toISOString().split('T')[0] : 'all'
  const filename = `journal-report-${fromStr}-to-${toStr}.csv`

  return {
    success: true,
    export: {
      csvContent,
      filename,
    },
  }
}
