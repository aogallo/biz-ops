import { db } from '~/server/db'
import { journalEntryModel, journalEntryLineModel } from '~/server/db/schemas/journalEntry'
import { accountingAccountModel } from '~/server/db/schemas/accounting'
import { companyModel } from '~/server/db/schemas/company'
import { eq, and, sql, lt, gte, lte } from 'drizzle-orm'

export interface RawTransactionLine {
  lineId: string
  entryId: string
  entryNumber: string
  entryDate: Date
  entryDescription: string
  lineDescription: string | null
  debitAmount: string
  creditAmount: string
  accountId: string
  accountNumber: string | null
  accountName: string | null
}

export interface OpeningBalanceRow {
  accountId: string
  totalDebit: string
  totalCredit: string
}

class GeneralLedgerRepository {
  /**
   * Get all accounting accounts for an organization, ordered by account_number.
   */
  async getAccountsByOrganization(organizationId: string) {
    return db
      .select({
        id: accountingAccountModel.id,
        accountNumber: accountingAccountModel.accountNumber,
        name: accountingAccountModel.name,
      })
      .from(accountingAccountModel)
      .where(eq(accountingAccountModel.organizationId, organizationId))
      .orderBy(accountingAccountModel.accountNumber)
  }

  /**
   * Get all posted journal entry lines within a date range,
   * joined with entries and accounts.
   */
  async getPostedLinesByDateRange(
    organizationId: string,
    params: {
      companyId?: string
      dateFrom: Date
      dateTo: Date
    }
  ): Promise<RawTransactionLine[]> {
    const conditions = [
      eq(journalEntryModel.organizationId, organizationId),
      eq(journalEntryModel.status, 'posted'),
      gte(journalEntryModel.entryDate, params.dateFrom),
      lte(journalEntryModel.entryDate, params.dateTo),
    ]

    if (params.companyId) {
      conditions.push(eq(journalEntryModel.companyId, params.companyId))
    }

    const rows = await db
      .select({
        lineId: journalEntryLineModel.id,
        entryId: journalEntryModel.id,
        entryNumber: journalEntryModel.entryNumber,
        entryDate: journalEntryModel.entryDate,
        entryDescription: journalEntryModel.description,
        lineDescription: journalEntryLineModel.description,
        debitAmount: journalEntryLineModel.debitAmount,
        creditAmount: journalEntryLineModel.creditAmount,
        accountId: journalEntryLineModel.accountingAccountId,
        accountNumber: accountingAccountModel.accountNumber,
        accountName: accountingAccountModel.name,
      })
      .from(journalEntryLineModel)
      .innerJoin(
        journalEntryModel,
        eq(journalEntryLineModel.journalEntryId, journalEntryModel.id)
      )
      .innerJoin(
        accountingAccountModel,
        eq(journalEntryLineModel.accountingAccountId, accountingAccountModel.id)
      )
      .where(and(...conditions))
      .orderBy(
        accountingAccountModel.accountNumber,
        journalEntryModel.entryDate,
        journalEntryModel.entryNumber
      )

    return rows
  }

  /**
   * Get opening balances (sum of debits and credits) per account
   * for all posted entries BEFORE the given date.
   */
  async getOpeningBalances(
    organizationId: string,
    params: {
      companyId?: string
      dateBefore: Date
    }
  ): Promise<Map<string, { totalDebit: number; totalCredit: number }>> {
    const conditions = [
      eq(journalEntryModel.organizationId, organizationId),
      eq(journalEntryModel.status, 'posted'),
      lt(journalEntryModel.entryDate, params.dateBefore),
    ]

    if (params.companyId) {
      conditions.push(eq(journalEntryModel.companyId, params.companyId))
    }

    const rows = await db
      .select({
        accountId: journalEntryLineModel.accountingAccountId,
        totalDebit: sql<string>`COALESCE(SUM(${journalEntryLineModel.debitAmount}), 0)`,
        totalCredit: sql<string>`COALESCE(SUM(${journalEntryLineModel.creditAmount}), 0)`,
      })
      .from(journalEntryLineModel)
      .innerJoin(
        journalEntryModel,
        eq(journalEntryLineModel.journalEntryId, journalEntryModel.id)
      )
      .where(and(...conditions))
      .groupBy(journalEntryLineModel.accountingAccountId)

    const map = new Map<string, { totalDebit: number; totalCredit: number }>()
    for (const row of rows) {
      map.set(row.accountId, {
        totalDebit: Number(row.totalDebit),
        totalCredit: Number(row.totalCredit),
      })
    }
    return map
  }

  /**
   * Get company name by ID.
   */
  async getCompanyName(companyId: string): Promise<string | null> {
    const [company] = await db
      .select({ name: companyModel.name })
      .from(companyModel)
      .where(eq(companyModel.id, companyId))
      .limit(1)
    return company?.name ?? null
  }
}

export const generalLedgerRepository = new GeneralLedgerRepository()
