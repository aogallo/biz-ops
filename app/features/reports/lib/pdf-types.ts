/**
 * PDF data types for journal report generation
 * Following the "Diario General" format
 */

export interface PDFJournalEntryLine {
  accountNumber: string
  accountName: string
  description: string
  debit: number
  credit: number
}

export interface PDFJournalEntry {
  type: string // e.g., "Eg", "Ig" extracted from entry number
  number: string // e.g., "01", "02"
  date: Date
  description: string
  lines: PDFJournalEntryLine[]
  subtotalDebit: number
  subtotalCredit: number
}

export interface PDFReportData {
  companyName: string
  period: {
    month: number
    year: number
  }
  entries: PDFJournalEntry[]
  grandTotalDebit: number
  grandTotalCredit: number
  totalEntries: number
}

/**
 * Parse entry number to extract type and number
 * Examples:
 * - "Eg 01" -> { type: "Eg", number: "01" }
 * - "Ig 02" -> { type: "Ig", number: "02" }
 * - "JRN-2023-0892" -> { type: "", number: "JRN-2023-0892" }
 */
export function parseEntryNumber(entryNumber: string): {
  type: string
  number: string
} {
  const match = entryNumber.match(/^([A-Za-z]+)\s*(.+)$/)
  return match ? { type: match[1], number: match[2] } : { type: '', number: entryNumber }
}

/**
 * Spanish month names for PDF header
 */
export const SPANISH_MONTHS = [
  'ENERO',
  'FEBRERO',
  'MARZO',
  'ABRIL',
  'MAYO',
  'JUNIO',
  'JULIO',
  'AGOSTO',
  'SEPTIEMBRE',
  'OCTUBRE',
  'NOVIEMBRE',
  'DICIEMBRE',
] as const

/**
 * Format a number with Spanish locale (comma for thousands, dot for decimals)
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-GT', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

/**
 * Format a date as DD/MM/YYYY
 */
export function formatDate(date: Date): string {
  const day = date.getDate().toString().padStart(2, '0')
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const year = date.getFullYear()
  return `${day}/${month}/${year}`
}
