import { eq } from 'drizzle-orm'
import {
  businessPartnersRepository,
  type PartnerToCreate,
} from '~/features/business-partners/server/repository'
import { db } from '~/server/db'
import { accountingAccountModel } from '~/server/db/schemas/accounting'
import { parseFile, type ParseResult } from '../../lib/file-parser'
import type { InvoiceType, SatFileRow } from '../../schemas'
import { satFileRepository } from '../repository/sat-file.repository'

export interface UploadResult {
  success: boolean
  inserted: number
  updated: number
  skipped: number
  errors: { row: number; field: string; message: string }[]
  totalRows: number
}

/**
 * Resolve account codes to account IDs
 * Returns a map of accountCode -> accountId
 */
async function resolveAccountCodes(
  organizationId: string,
  accountCodes: string[]
): Promise<Map<string, string>> {
  if (accountCodes.length === 0) return new Map()

  // Remove duplicates and empty values
  const uniqueCodes = [...new Set(accountCodes.filter((code) => code?.trim()))]

  if (uniqueCodes.length === 0) return new Map()

  const accounts = await db
    .select({ id: accountingAccountModel.id, accountNumber: accountingAccountModel.accountNumber })
    .from(accountingAccountModel)
    .where(
      eq(accountingAccountModel.organizationId, organizationId)
    )

  // Build map of accountNumber -> id
  const codeToIdMap = new Map<string, string>()
  for (const account of accounts) {
    if (account.accountNumber && uniqueCodes.includes(account.accountNumber)) {
      codeToIdMap.set(account.accountNumber, account.id)
    }
  }

  return codeToIdMap
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
      inserted: 0,
      updated: 0,
      skipped: 0,
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

  // Check if any row has account code data
  const accountCodes = parseResult.data
    .map((row) => row.accountCode)
    .filter((code): code is string => !!code?.trim())

  const hasAccountData = accountCodes.length > 0

  // Resolve account codes to IDs if present
  const accountCodeToIdMap = hasAccountData
    ? await resolveAccountCodes(organizationId, accountCodes)
    : new Map<string, string>()

  const recordsToUpsert = parseResult.data.map((row: SatFileRow) => {
    // Determine business partner ID based on invoice type
    let businessPartnerId: string | null = null
    if (invoiceType === 'sales' && row.receptorNit) {
      businessPartnerId = nitToPartnerIdMap.get(row.receptorNit) ?? null
    } else if (invoiceType === 'purchase' && row.emitterNit) {
      businessPartnerId = nitToPartnerIdMap.get(row.emitterNit) ?? null
    }

    // Resolve account code to ID if present
    let accountingAccountId: string | null = null
    if (row.accountCode?.trim()) {
      accountingAccountId = accountCodeToIdMap.get(row.accountCode.trim()) ?? null
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
      accountingAccountId,
    }
  })

  try {
    const result = await satFileRepository.upsertMany(recordsToUpsert, {
      updateAccountingAccount: hasAccountData,
    })

    return {
      success: true,
      inserted: result.inserted,
      updated: result.updated,
      skipped: result.skipped,
      errors: parseResult.errors,
      totalRows: parseResult.totalRows,
    }
  } catch (error) {
    return {
      success: false,
      inserted: 0,
      updated: 0,
      skipped: 0,
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
