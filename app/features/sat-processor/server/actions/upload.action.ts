import {
  businessPartnersRepository,
  type PartnerToCreate,
} from '~/features/business-partners/server/repository'
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

  // Extract business partners based on invoice type
  // SALES: receptor is the client (buyer)
  // PURCHASE: emitter is the vendor (seller)
  const partnersToCreate: PartnerToCreate[] = []

  for (const row of parseResult.data) {
    if (invoiceType === 'sales') {
      // For sales, the receptor is the client
      if (row.receptorNit) {
        partnersToCreate.push({
          nit: row.receptorNit,
          name: row.receptorName || row.receptorNit,
          type: 'client',
        })
      }
    } else {
      // For purchases, the emitter is the vendor
      if (row.emitterNit) {
        partnersToCreate.push({
          nit: row.emitterNit,
          name: row.emitterName || row.emitterNit,
          type: 'vendor',
        })
      }
    }
  }

  // Bulk create or find business partners
  const nitToPartnerIdMap =
    await businessPartnersRepository.bulkFindOrCreateByNit(
      organizationId,
      partnersToCreate
    )

  const recordsToInsert = parseResult.data.map((row: SatFileRow) => {
    // Determine business partner ID based on invoice type
    let businessPartnerId: string | null = null
    if (invoiceType === 'sales' && row.receptorNit) {
      businessPartnerId = nitToPartnerIdMap.get(row.receptorNit) ?? null
    } else if (invoiceType === 'purchase' && row.emitterNit) {
      businessPartnerId = nitToPartnerIdMap.get(row.emitterNit) ?? null
    }

    return {
      organizationId,
      companyId,
      date: row.date,
      authorizationNumber: row.authorizationNumber,
      dteType: row.dteType,
      serie: row.serie,
      dteNumber: row.dteNumber,
      emitterNit: row.emitterNit ?? null,
      emitterName: row.emitterName ?? null,
      receptorNit: row.receptorNit ?? null,
      receptorName: row.receptorName ?? null,
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
      businessPartnerId,
    }
  })

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
