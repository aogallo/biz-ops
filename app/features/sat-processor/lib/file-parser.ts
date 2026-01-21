import * as XLSX from 'xlsx'
import { satFileRowSchema, type SatFileRow } from '../schemas'

export interface ParseResult {
  data: SatFileRow[]
  errors: ParseError[]
  totalRows: number
}

export interface ParseError {
  row: number
  field: string
  message: string
}

const COLUMN_MAPPING: Record<string, keyof SatFileRow> = {
  'fecha de emisión': 'date',
  'número de autorización': 'authorizationNumber',
  'tipo de dte (nombre)': 'dteType',
  serie: 'serie',
  'número del dte': 'dteNumber',
  'nit del emisor': 'emitterNit',
  'nombre completo del emisor': 'emitterName',
  'nit del receptor': 'receptorNit',
  'nombre completo del receptor': 'receptorName',
  exportacion: 'exportation',
  'nit del certificador': 'certificatorNit',
  'nombre completo del certificador': 'certificatorName',
  estado: 'state',
  moneda: 'money',
  'gran total (moneda original)': 'total',
  'iva (monto de este impuesto)': 'iva',
  'marca de anulado': 'isVoided',
  'fecha anulación': 'voidedDate',
  petróleo: 'petroleum',
  'turismo hospedaje (monto de este impuesto)': 'hotel',
  'turismo pasajes (monto de este impuesto)': 'tickets',
  'timbre de prensa (monto de este impuesto)': 'pressStamp',
  'bomberos (monto de este impuesto)': 'firefighters',
  'Impuesto Municipal': 'municipalTax',
  'tasa municipal (monto de este impuesto)': 'municipalTax',
  'bebidas alcohólicas (monto de este impuesto)': 'alcoholicTax',
  'tabaco (monto de este impuesto)': 'tobaccoTax',
  'Impuesto Cemento': 'cementTax',
  'cemento (monto de este impuesto)': 'cementTax',
  'Impuesto No Alcoholico': 'noAlcoholicTax',
  'bebidas no alcohólicas (monto de este impuesto)': 'noAlcoholicTax',
  'tarifa portuaria (monto de este impuesto)': 'portTariffTax',
}

function normalizeColumnName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, ' ')
}

function mapRowToSatFileRow(row: Record<string, unknown>): Partial<SatFileRow> {
  const mapped: Partial<SatFileRow> = {}

  for (const [key, value] of Object.entries(row)) {
    const normalizedKey = normalizeColumnName(key)

    let mappedKey: keyof SatFileRow | undefined
    for (const [columnName, fieldName] of Object.entries(COLUMN_MAPPING)) {
      if (normalizeColumnName(columnName) === normalizedKey) {
        mappedKey = fieldName
        break
      }
    }

    if (mappedKey) {
      if (mappedKey === 'exportation' || mappedKey === 'isVoided') {
        mapped[mappedKey] =
          value === 'Si' ||
          value === 'SI' ||
          value === 'true' ||
          value === true ||
          value === '1'
      } else {
        mapped[mappedKey] = value as never
      }
    }
  }

  return mapped
}

/**
 * Simple CSV parser that works in edge runtimes (Cloudflare Workers)
 */
function parseCSVContent(content: string): Record<string, string>[] {
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
  const validData: SatFileRow[] = []

  try {
    const rows = parseCSVContent(content)

    rows.forEach((row, index) => {
      const mappedRow = mapRowToSatFileRow(row)
      const validation = satFileRowSchema.safeParse(mappedRow)

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
  const validData: SatFileRow[] = []

  try {
    const workbook = XLSX.read(buffer, { type: 'array' })
    const firstSheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[firstSheetName]

    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet)

    rows.forEach((row, index) => {
      const mappedRow = mapRowToSatFileRow(row)
      const validation = satFileRowSchema.safeParse(mappedRow)

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
        message: 'Unsupported file format. Please use CSV or XLS/XLSX.',
      },
    ],
    totalRows: 0,
  }
}
