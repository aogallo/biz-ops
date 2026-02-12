/**
 * Types for the General Ledger (Libro Mayor) report.
 *
 * The report renders as a flat list of discriminated rows:
 *   account-header  -> transaction* -> account-total
 * grouped by accounting account, with parent-account subtotals.
 */

// ── Row discriminated union ────────────────────────────────────────

export interface GeneralLedgerAccountHeader {
  rowType: 'account-header'
  accountId: string
  accountNumber: string
  accountName: string
  openingBalance: number
  level: number // hierarchy depth (0 = top-level)
}

export interface GeneralLedgerTransaction {
  rowType: 'transaction'
  entryId: string
  entryType: string // e.g. "Ig", "Eg", "Dr"
  entryNumber: string
  entryDate: string // DD/MM/YYYY
  description: string
  debit: number
  credit: number
  runningBalance: number
}

export interface GeneralLedgerAccountTotal {
  rowType: 'account-total'
  accountNumber: string
  accountName: string
  totalDebit: number
  totalCredit: number
  closingBalance: number
}

export type GeneralLedgerRow =
  | GeneralLedgerAccountHeader
  | GeneralLedgerTransaction
  | GeneralLedgerAccountTotal

// ── Aggregates & result types ──────────────────────────────────────

export interface GeneralLedgerGrandTotals {
  totalDebit: number
  totalCredit: number
  totalOpeningBalance: number
  totalClosingBalance: number
}

export interface GenerateGeneralLedgerResult {
  success: true
  data: GeneralLedgerRow[]
  grandTotals: GeneralLedgerGrandTotals
  reportMonth: string // "ENERO 2025"
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface ExportGeneralLedgerResult {
  success: true
  export: {
    pdfBase64: string
    filename: string
  }
}

// ── PDF-specific ───────────────────────────────────────────────────

export interface PDFGeneralLedgerReportData {
  companyName: string
  reportTitle: string
  dateFrom: string
  dateTo: string
  rows: GeneralLedgerRow[]
  grandTotals: GeneralLedgerGrandTotals
}
