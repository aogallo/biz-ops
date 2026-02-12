import type {
  LedgerReportLineItem,
  LedgerGrandTotals,
} from '~/features/invoice/server/ledger-report.repository'

export interface PDFLedgerRow {
  fecha: string
  tipoDoc: string
  tipoTran: string
  serie: string
  noDocto: string
  nit: string
  nombre: string
  localGravadosBienes: number
  localGravadosServicios: number
  localExentosBienes: number
  localExentosServicios: number
  importGravadosBienes: number
  importGravadosServicios: number
  importExentosBienes: number
  importExentosServicios: number
  ivaAmount: number
  totalDocumento: number
}

export interface PDFLedgerReportData {
  companyName: string
  reportTitle: string
  dateFrom: string
  dateTo: string
  rows: PDFLedgerRow[]
  grandTotals: LedgerGrandTotals
  totalDocuments: number
}

export interface GenerateLedgerReportResult {
  success: true
  data: LedgerReportLineItem[]
  grandTotals: LedgerGrandTotals
  total: number
  totalDocuments: number
  page: number
  pageSize: number
  totalPages: number
}

export interface ExportLedgerReportResult {
  success: true
  export: {
    pdfBase64: string
    filename: string
  }
}
