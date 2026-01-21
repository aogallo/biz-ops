import { parseFile, type ParseResult } from '../../lib/file-parser'
import type { InvoiceType, SatFileRow } from '../../schemas'
import { satFileRepository } from '../repository/sat-file.repository'

export interface UploadResult {
  success: boolean
  created: number
  errors: { row: number; field: string; message: string }[]
  totalRows: number
}

export async function uploadSatFileAction(
  file: File,
  organizationId: string,
  companyId: string,
  invoiceType: InvoiceType
): Promise<UploadResult> {
  const parseResult: ParseResult = await parseFile(file)

  if (parseResult.data.length === 0) {
    return {
      success: false,
      created: 0,
      errors:
        parseResult.errors.length > 0
          ? parseResult.errors
          : [{ row: 0, field: 'file', message: 'No valid data found in file' }],
      totalRows: parseResult.totalRows,
    }
  }

  const recordsToInsert = parseResult.data.map((row: SatFileRow) => ({
    organizationId,
    companyId,
    date: row.date,
    authorizationNumber: row.authorizationNumber,
    dteType: row.dteType,
    serie: row.serie,
    dteNumber: row.dteNumber,
    emitterNit: row.emitterNit ?? null,
    emitterName: row.emitterName ?? null,
    exportation: row.exportation,
    certificatorNit: row.certificatorNit ?? null,
    certificatorName: row.certificatorName ?? null,
    state: row.state,
    money: row.money,
    total: row.total,
    iva: row.iva,
    isVoided: row.isVoided,
    voidedDate: row.voidedDate ?? null,
    petroleum: row.petroleum,
    hotel: row.hotel,
    tickets: row.tickets,
    pressStamp: row.pressStamp,
    firefighters: row.firefighters,
    municipalTax: row.municipalTax,
    alcoholicTax: row.alcoholicTax,
    tobaccoTax: row.tobaccoTax,
    cementTax: row.cementTax,
    noAlcoholicTax: row.noAlcoholicTax,
    portTariffTax: row.portTariffTax,
    invoiceType,
  }))

  try {
    const created = await satFileRepository.createMany(recordsToInsert)

    return {
      success: true,
      created: created.length,
      errors: parseResult.errors,
      totalRows: parseResult.totalRows,
    }
  } catch (error) {
    return {
      success: false,
      created: 0,
      errors: [
        ...parseResult.errors,
        {
          row: 0,
          field: 'database',
          message:
            error instanceof Error ? error.message : 'Failed to save records',
        },
      ],
      totalRows: parseResult.totalRows,
    }
  }
}
