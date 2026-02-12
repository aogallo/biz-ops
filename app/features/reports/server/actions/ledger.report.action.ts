import {
  ledgerReportRepository,
} from '~/features/invoice/server/ledger-report.repository'
import type { GenerateReportInput, ExportReportInput } from '../../schemas'
import type {
  GenerateLedgerReportResult,
  ExportLedgerReportResult,
  PDFLedgerReportData,
} from '../../lib/ledger-pdf-types'
import { generateLedgerPDF } from '../../lib/ledger-pdf-generator'
import { formatDate } from '../../lib/pdf-types'

function parseDate(dateStr: string | undefined): Date | undefined {
  if (!dateStr) return undefined
  const date = new Date(dateStr)
  return isNaN(date.getTime()) ? undefined : date
}

export async function generateSalesLedgerAction(
  organizationId: string,
  input: Omit<GenerateReportInput, '_action'>
): Promise<GenerateLedgerReportResult> {
  return generateLedgerAction(organizationId, input, 'sale')
}

export async function generatePurchaseLedgerAction(
  organizationId: string,
  input: Omit<GenerateReportInput, '_action'>
): Promise<GenerateLedgerReportResult> {
  return generateLedgerAction(organizationId, input, 'purchase')
}

async function generateLedgerAction(
  organizationId: string,
  input: Omit<GenerateReportInput, '_action'>,
  type: 'sale' | 'purchase'
): Promise<GenerateLedgerReportResult> {
  const { companyId, dateFrom, dateTo, page, pageSize } = input
  const offset = (page - 1) * pageSize

  const result = await ledgerReportRepository.getForReport(organizationId, {
    companyId,
    dateFrom: parseDate(dateFrom),
    dateTo: parseDate(dateTo),
    type,
    limit: pageSize,
    offset,
  })

  return {
    success: true,
    data: result.data,
    grandTotals: result.grandTotals,
    total: result.total,
    totalDocuments: result.total,
    page,
    pageSize,
    totalPages: Math.ceil(result.total / pageSize),
  }
}

export async function exportSalesLedgerAction(
  organizationId: string,
  input: Omit<ExportReportInput, '_action'>
): Promise<ExportLedgerReportResult> {
  return exportLedgerAction(organizationId, input, 'sale', 'sales')
}

export async function exportPurchaseLedgerAction(
  organizationId: string,
  input: Omit<ExportReportInput, '_action'>
): Promise<ExportLedgerReportResult> {
  return exportLedgerAction(organizationId, input, 'purchase', 'purchase')
}

async function exportLedgerAction(
  organizationId: string,
  input: Omit<ExportReportInput, '_action'>,
  type: 'sale' | 'purchase',
  reportType: 'sales' | 'purchase'
): Promise<ExportLedgerReportResult> {
  const { companyId, dateFrom, dateTo } = input

  const parsedDateFrom = parseDate(dateFrom)
  const parsedDateTo = parseDate(dateTo)

  const result = await ledgerReportRepository.getAllForPdfExport(organizationId, {
    companyId,
    dateFrom: parsedDateFrom,
    dateTo: parsedDateTo,
    type,
  })

  const dateFromStr = parsedDateFrom
    ? formatDate(parsedDateFrom)
    : '01/01/' + new Date().getFullYear()
  const dateToStr = parsedDateTo
    ? formatDate(parsedDateTo)
    : '31/12/' + new Date().getFullYear()

  const pdfData: PDFLedgerReportData = {
    companyName: result.companyName || 'Empresa',
    reportTitle:
      reportType === 'sales'
        ? 'REPORTE DE VENTAS - DEBITO FISCAL'
        : 'REPORTE DE COMPRAS - CREDITO FISCAL',
    dateFrom: dateFromStr,
    dateTo: dateToStr,
    rows: result.data,
    grandTotals: result.grandTotals,
    totalDocuments: result.totalDocuments,
  }

  const pdfBytes = await generateLedgerPDF(pdfData)
  const pdfBase64 = btoa(String.fromCharCode(...pdfBytes))

  const fromStr = dateFrom ? new Date(dateFrom).toISOString().split('T')[0] : 'all'
  const toStr = dateTo ? new Date(dateTo).toISOString().split('T')[0] : 'all'
  const prefix = reportType === 'sales' ? 'libro-ventas' : 'libro-compras'
  const filename = `${prefix}-${fromStr}-to-${toStr}.pdf`

  return {
    success: true,
    export: {
      pdfBase64,
      filename,
    },
  }
}
