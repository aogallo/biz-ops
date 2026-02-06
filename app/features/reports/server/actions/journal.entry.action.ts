import {
  journalEntryRepository,
  type ReportLineItem,
} from '~/features/journal-entry/server/repository'
import type { GenerateReportInput, ExportReportInput } from '../../schemas'
import { generateJournalPDF } from '../../lib/pdf-generator'
import {
  type PDFReportData,
  type PDFJournalEntry,
  parseEntryNumber,
} from '../../lib/pdf-types'

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
    pdfBase64: string
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

  const parsedDateFrom = parseDate(dateFrom)
  const parsedDateTo = parseDate(dateTo)

  const { entries, companyName } = await journalEntryRepository.getAllForPdfExport(
    organizationId,
    {
      companyId,
      dateFrom: parsedDateFrom,
      dateTo: parsedDateTo,
    }
  )

  // Transform data to PDF format
  let grandTotalDebit = 0
  let grandTotalCredit = 0

  const pdfEntries: PDFJournalEntry[] = entries.map((entry) => {
    const { type, number } = parseEntryNumber(entry.entryNumber)

    let subtotalDebit = 0
    let subtotalCredit = 0

    const lines = entry.lines.map((line) => {
      const debit = Number(line.debitAmount || 0)
      const credit = Number(line.creditAmount || 0)
      subtotalDebit += debit
      subtotalCredit += credit

      return {
        accountNumber: line.accountNumber || '',
        accountName: line.accountName || 'Unknown Account',
        description: line.description || '',
        debit,
        credit,
      }
    })

    grandTotalDebit += subtotalDebit
    grandTotalCredit += subtotalCredit

    return {
      type,
      number,
      date: new Date(entry.entryDate),
      description: entry.description,
      lines,
      subtotalDebit,
      subtotalCredit,
    }
  })

  // Determine the period from the date range
  const periodDate = parsedDateFrom || parsedDateTo || new Date()
  const period = {
    month: periodDate.getMonth(),
    year: periodDate.getFullYear(),
  }

  const pdfData: PDFReportData = {
    companyName: companyName || 'Unknown Company',
    period,
    entries: pdfEntries,
    grandTotalDebit,
    grandTotalCredit,
    totalEntries: entries.length,
  }

  // Generate PDF
  const pdfBytes = await generateJournalPDF(pdfData)

  // Convert to base64
  const pdfBase64 = btoa(String.fromCharCode(...pdfBytes))

  // Generate filename with date range
  const fromStr = dateFrom ? new Date(dateFrom).toISOString().split('T')[0] : 'all'
  const toStr = dateTo ? new Date(dateTo).toISOString().split('T')[0] : 'all'
  const filename = `diario-general-${fromStr}-to-${toStr}.pdf`

  return {
    success: true,
    export: {
      pdfBase64,
      filename,
    },
  }
}
