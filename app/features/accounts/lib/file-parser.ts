import * as XLSX from 'xlsx'
import { csvAccountRowSchema, type CsvAccountRow } from '../schemas'

export interface ParseResult {
  data: CsvAccountRow[]
  errors: ParseError[]
  totalRows: number
}

export interface ParseError {
  row: number
  field: string
  message: string
}

// Column name mappings for flexible column matching
const COLUMN_MAPPING: Record<string, keyof CsvAccountRow> = {
  // Account number variations
  accountnumber: 'accountNumber',
  'account number': 'accountNumber',
  account_number: 'accountNumber',
  'account-number': 'accountNumber',
  account: 'accountNumber',
  code: 'accountNumber',
  'account code': 'accountNumber',
  account_code: 'accountNumber',
  numero: 'accountNumber',
  'numero de cuenta': 'accountNumber',
  // Name variations
  name: 'name',
  'account name': 'name',
  account_name: 'name',
  description: 'name',
  nombre: 'name',
  'nombre de cuenta': 'name',
}

function normalizeColumnName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, ' ')
}

function mapRowToCsvAccountRow(
  row: Record<string, unknown>
): Partial<CsvAccountRow> {
  const mapped: Partial<CsvAccountRow> = {}

  for (const [key, value] of Object.entries(row)) {
    const normalizedKey = normalizeColumnName(key)

    let mappedKey: keyof CsvAccountRow | undefined
    for (const [columnName, fieldName] of Object.entries(COLUMN_MAPPING)) {
      if (normalizeColumnName(columnName) === normalizedKey) {
        mappedKey = fieldName
        break
      }
    }

    if (mappedKey && value !== null && value !== undefined) {
      mapped[mappedKey] = String(value).trim()
    }
  }

  return mapped
}

/**
 * Simple CSV parser that works in edge runtimes (Cloudflare Workers)
 */
export function parseCSVContent(content: string): Record<string, string>[] {
  const lines = content.split(/\r?\n/).filter((line) => line.trim() !== '')

  if (lines.length === 0) {
    return []
  }

  // Parse header row
  const headers = parseCSVLine(lines[0])

  // Parse data rows
  const rows: Record<string, string>[] = []
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i])
    const row: Record<string, string> = {}

    headers.forEach((header, index) => {
      row[header] = values[index] ?? ''
    })

    rows.push(row)
  }

  return rows
}

/**
 * Parse a single CSV line, handling quoted fields
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    const nextChar = line[i + 1]

    if (inQuotes) {
      if (char === '"' && nextChar === '"') {
        // Escaped quote
        current += '"'
        i++
      } else if (char === '"') {
        // End of quoted field
        inQuotes = false
      } else {
        current += char
      }
    } else {
      if (char === '"') {
        // Start of quoted field
        inQuotes = true
      } else if (char === ',') {
        // Field separator
        result.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }
  }

  // Push the last field
  result.push(current.trim())

  return result
}

export async function parseCSV(content: string): Promise<ParseResult> {
  const errors: ParseError[] = []
  const validData: CsvAccountRow[] = []

  try {
    const rows = parseCSVContent(content)

    rows.forEach((row, index) => {
      const mappedRow = mapRowToCsvAccountRow(row)
      const validation = csvAccountRowSchema.safeParse(mappedRow)

      if (validation.success) {
        validData.push(validation.data)
      } else {
        validation.error.issues.forEach((issue) => {
          errors.push({
            row: index + 2, // +1 for header, +1 for 1-based index
            field: issue.path.join('.'),
            message: issue.message,
          })
        })
      }
    })

    return {
      data: validData,
      errors,
      totalRows: rows.length,
    }
  } catch (err) {
    errors.push({
      row: 0,
      field: 'file',
      message: err instanceof Error ? err.message : 'Failed to parse CSV file',
    })
    return {
      data: [],
      errors,
      totalRows: 0,
    }
  }
}

export async function parseExcel(buffer: ArrayBuffer): Promise<ParseResult> {
  const errors: ParseError[] = []
  const validData: CsvAccountRow[] = []

  try {
    const workbook = XLSX.read(buffer, { type: 'array' })
    const firstSheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[firstSheetName]

    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet)

    rows.forEach((row, index) => {
      const mappedRow = mapRowToCsvAccountRow(row)
      const validation = csvAccountRowSchema.safeParse(mappedRow)

      if (validation.success) {
        validData.push(validation.data)
      } else {
        validation.error.issues.forEach((issue) => {
          errors.push({
            row: index + 2,
            field: issue.path.join('.'),
            message: issue.message,
          })
        })
      }
    })

    return {
      data: validData,
      errors,
      totalRows: rows.length,
    }
  } catch (err) {
    errors.push({
      row: 0,
      field: 'file',
      message:
        err instanceof Error ? err.message : 'Failed to parse Excel file',
    })
    return {
      data: [],
      errors,
      totalRows: 0,
    }
  }
}

export async function parseFile(file: File): Promise<ParseResult> {
  const fileName = file.name.toLowerCase()

  if (fileName.endsWith('.csv')) {
    const content = await file.text()
    return parseCSV(content)
  }

  if (fileName.endsWith('.xls') || fileName.endsWith('.xlsx')) {
    const buffer = await file.arrayBuffer()
    return parseExcel(buffer)
  }

  return {
    data: [],
    errors: [
      {
        row: 0,
        field: 'file',
        message:
          'Unsupported file format. Please use CSV or Excel (.xls, .xlsx).',
      },
    ],
    totalRows: 0,
  }
}
