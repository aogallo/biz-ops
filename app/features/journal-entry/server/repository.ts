import { and, count, desc, eq, sql } from 'drizzle-orm'
import { db } from '~/server/db'
import {
  journalEntryModel,
  journalEntryLineModel,
  type JournalEntry,
  type JournalEntryLine,
  type InsertJournalEntry,
  type InsertJournalEntryLine,
} from '~/server/db/schemas/journalEntry'
import { accountingAccountModel } from '~/server/db/schemas/accounting'
import { companyModel } from '~/server/db/schemas/company'

export interface JournalEntryWithLines extends JournalEntry {
  lines: (JournalEntryLine & {
    accountingAccount: {
      id: string
      name: string | null
      accountNumber: string | null
    } | null
  })[]
  company?: {
    id: string
    name: string
  } | null
}

export interface GetJournalEntriesOptions {
  companyId?: string
  status?: 'draft' | 'posted' | 'voided'
  limit?: number
  offset?: number
}

export class JournalEntryRepository {
  async create(
    data: Omit<InsertJournalEntry, 'id' | 'createdAt' | 'updatedAt'>,
    lines: Omit<InsertJournalEntryLine, 'id' | 'journalEntryId' | 'createdAt' | 'updatedAt'>[]
  ): Promise<JournalEntry> {
    return await db.transaction(async (tx) => {
      // Calculate totals
      const totalDebit = lines
        .reduce((sum, line) => sum + Number(line.debitAmount || 0), 0)
        .toFixed(2)
      const totalCredit = lines
        .reduce((sum, line) => sum + Number(line.creditAmount || 0), 0)
        .toFixed(2)

      // Insert journal entry
      const [journalEntry] = await tx
        .insert(journalEntryModel)
        .values({
          ...data,
          totalDebit,
          totalCredit,
        })
        .returning()

      // Insert journal entry lines
      if (lines.length > 0) {
        await tx.insert(journalEntryLineModel).values(
          lines.map((line, index) => ({
            ...line,
            journalEntryId: journalEntry.id,
            lineNumber: line.lineNumber ?? index + 1,
          }))
        )
      }

      return journalEntry
    })
  }

  async getById(id: string): Promise<JournalEntryWithLines | null> {
    const [entry] = await db
      .select()
      .from(journalEntryModel)
      .where(eq(journalEntryModel.id, id))
      .limit(1)

    if (!entry) return null

    const lines = await db
      .select({
        id: journalEntryLineModel.id,
        journalEntryId: journalEntryLineModel.journalEntryId,
        lineNumber: journalEntryLineModel.lineNumber,
        accountingAccountId: journalEntryLineModel.accountingAccountId,
        description: journalEntryLineModel.description,
        debitAmount: journalEntryLineModel.debitAmount,
        creditAmount: journalEntryLineModel.creditAmount,
        invoiceLineId: journalEntryLineModel.invoiceLineId,
        createdAt: journalEntryLineModel.createdAt,
        updatedAt: journalEntryLineModel.updatedAt,
        accountingAccount: {
          id: accountingAccountModel.id,
          name: accountingAccountModel.name,
          accountNumber: accountingAccountModel.accountNumber,
        },
      })
      .from(journalEntryLineModel)
      .leftJoin(
        accountingAccountModel,
        eq(journalEntryLineModel.accountingAccountId, accountingAccountModel.id)
      )
      .where(eq(journalEntryLineModel.journalEntryId, id))
      .orderBy(journalEntryLineModel.lineNumber)

    const [company] = await db
      .select({
        id: companyModel.id,
        name: companyModel.name,
      })
      .from(companyModel)
      .where(eq(companyModel.id, entry.companyId))
      .limit(1)

    return {
      ...entry,
      lines,
      company,
    }
  }

  async getAll(
    organizationId: string,
    options: Omit<GetJournalEntriesOptions, 'limit' | 'offset'> = {}
  ): Promise<JournalEntryWithLines[]> {
    const { companyId, status } = options

    const conditions = [eq(journalEntryModel.organizationId, organizationId)]

    if (companyId) {
      conditions.push(eq(journalEntryModel.companyId, companyId))
    }

    if (status) {
      conditions.push(eq(journalEntryModel.status, status))
    }

    // Get entries
    const entries = await db
      .select({
        entry: journalEntryModel,
        company: {
          id: companyModel.id,
          name: companyModel.name,
        },
      })
      .from(journalEntryModel)
      .leftJoin(companyModel, eq(journalEntryModel.companyId, companyModel.id))
      .where(and(...conditions))
      .orderBy(desc(journalEntryModel.entryDate), desc(journalEntryModel.createdAt))

    // Get lines for all entries
    const entryIds = entries.map((e) => e.entry.id)
    const allLines =
      entryIds.length > 0
        ? await db
            .select({
              id: journalEntryLineModel.id,
              journalEntryId: journalEntryLineModel.journalEntryId,
              lineNumber: journalEntryLineModel.lineNumber,
              accountingAccountId: journalEntryLineModel.accountingAccountId,
              description: journalEntryLineModel.description,
              debitAmount: journalEntryLineModel.debitAmount,
              creditAmount: journalEntryLineModel.creditAmount,
              invoiceLineId: journalEntryLineModel.invoiceLineId,
              createdAt: journalEntryLineModel.createdAt,
              updatedAt: journalEntryLineModel.updatedAt,
              accountingAccount: {
                id: accountingAccountModel.id,
                name: accountingAccountModel.name,
                accountNumber: accountingAccountModel.accountNumber,
              },
            })
            .from(journalEntryLineModel)
            .leftJoin(
              accountingAccountModel,
              eq(
                journalEntryLineModel.accountingAccountId,
                accountingAccountModel.id
              )
            )
            .where(
              sql`${journalEntryLineModel.journalEntryId} IN (${sql.join(
                entryIds.map((id) => sql`${id}`),
                sql`, `
              )})`
            )
            .orderBy(journalEntryLineModel.lineNumber)
        : []

    // Group lines by entry
    const linesByEntry = allLines.reduce(
      (acc, line) => {
        if (!acc[line.journalEntryId]) {
          acc[line.journalEntryId] = []
        }
        acc[line.journalEntryId].push(line)
        return acc
      },
      {} as Record<string, typeof allLines>
    )

    return entries.map((e) => ({
      ...e.entry,
      lines: linesByEntry[e.entry.id] || [],
      company: e.company,
    }))
  }

  async getPaginated(
    organizationId: string,
    options: GetJournalEntriesOptions = {}
  ): Promise<{ entries: JournalEntryWithLines[]; total: number }> {
    const { companyId, status, limit = 10, offset = 0 } = options

    const conditions = [eq(journalEntryModel.organizationId, organizationId)]

    if (companyId) {
      conditions.push(eq(journalEntryModel.companyId, companyId))
    }

    if (status) {
      conditions.push(eq(journalEntryModel.status, status))
    }

    // Get total count
    const [{ count: total }] = await db
      .select({ count: count() })
      .from(journalEntryModel)
      .where(and(...conditions))

    // Get entries
    const entries = await db
      .select({
        entry: journalEntryModel,
        company: {
          id: companyModel.id,
          name: companyModel.name,
        },
      })
      .from(journalEntryModel)
      .leftJoin(companyModel, eq(journalEntryModel.companyId, companyModel.id))
      .where(and(...conditions))
      .orderBy(desc(journalEntryModel.entryDate), desc(journalEntryModel.createdAt))
      .limit(limit)
      .offset(offset)

    // Get lines for all entries
    const entryIds = entries.map((e) => e.entry.id)
    const allLines =
      entryIds.length > 0
        ? await db
            .select({
              id: journalEntryLineModel.id,
              journalEntryId: journalEntryLineModel.journalEntryId,
              lineNumber: journalEntryLineModel.lineNumber,
              accountingAccountId: journalEntryLineModel.accountingAccountId,
              description: journalEntryLineModel.description,
              debitAmount: journalEntryLineModel.debitAmount,
              creditAmount: journalEntryLineModel.creditAmount,
              invoiceLineId: journalEntryLineModel.invoiceLineId,
              createdAt: journalEntryLineModel.createdAt,
              updatedAt: journalEntryLineModel.updatedAt,
              accountingAccount: {
                id: accountingAccountModel.id,
                name: accountingAccountModel.name,
                accountNumber: accountingAccountModel.accountNumber,
              },
            })
            .from(journalEntryLineModel)
            .leftJoin(
              accountingAccountModel,
              eq(
                journalEntryLineModel.accountingAccountId,
                accountingAccountModel.id
              )
            )
            .where(
              sql`${journalEntryLineModel.journalEntryId} IN (${sql.join(
                entryIds.map((id) => sql`${id}`),
                sql`, `
              )})`
            )
            .orderBy(journalEntryLineModel.lineNumber)
        : []

    // Group lines by entry
    const linesByEntry = allLines.reduce(
      (acc, line) => {
        if (!acc[line.journalEntryId]) {
          acc[line.journalEntryId] = []
        }
        acc[line.journalEntryId].push(line)
        return acc
      },
      {} as Record<string, typeof allLines>
    )

    const entriesWithLines: JournalEntryWithLines[] = entries.map((e) => ({
      ...e.entry,
      lines: linesByEntry[e.entry.id] || [],
      company: e.company,
    }))

    return {
      entries: entriesWithLines,
      total,
    }
  }

  async getByInvoiceId(invoiceId: string): Promise<JournalEntry | null> {
    const [entry] = await db
      .select()
      .from(journalEntryModel)
      .where(eq(journalEntryModel.sourceInvoiceId, invoiceId))
      .limit(1)

    return entry ?? null
  }

  async getBySatFileId(satFileId: string): Promise<JournalEntry | null> {
    const [entry] = await db
      .select()
      .from(journalEntryModel)
      .where(eq(journalEntryModel.sourceSatFileId, satFileId))
      .limit(1)

    return entry ?? null
  }

  async updateStatus(
    id: string,
    status: 'draft' | 'posted' | 'voided',
    userId?: string
  ): Promise<JournalEntry | null> {
    const updateData: Partial<InsertJournalEntry> = { status }

    if (status === 'posted') {
      updateData.postedAt = new Date()
      updateData.postedBy = userId
    }

    const [updated] = await db
      .update(journalEntryModel)
      .set({
        ...updateData,
        updatedAt: new Date(),
      })
      .where(eq(journalEntryModel.id, id))
      .returning()

    return updated ?? null
  }

  async updateLines(
    journalEntryId: string,
    lines: Omit<InsertJournalEntryLine, 'id' | 'journalEntryId' | 'createdAt' | 'updatedAt'>[]
  ): Promise<void> {
    await db.transaction(async (tx) => {
      // Delete existing lines
      await tx
        .delete(journalEntryLineModel)
        .where(eq(journalEntryLineModel.journalEntryId, journalEntryId))

      // Calculate new totals
      const totalDebit = lines
        .reduce((sum, line) => sum + Number(line.debitAmount || 0), 0)
        .toFixed(2)
      const totalCredit = lines
        .reduce((sum, line) => sum + Number(line.creditAmount || 0), 0)
        .toFixed(2)

      // Insert new lines
      if (lines.length > 0) {
        await tx.insert(journalEntryLineModel).values(
          lines.map((line, index) => ({
            ...line,
            journalEntryId,
            lineNumber: line.lineNumber ?? index + 1,
          }))
        )
      }

      // Update totals
      await tx
        .update(journalEntryModel)
        .set({
          totalDebit,
          totalCredit,
          updatedAt: new Date(),
        })
        .where(eq(journalEntryModel.id, journalEntryId))
    })
  }

  async delete(id: string): Promise<boolean> {
    const result = await db
      .delete(journalEntryModel)
      .where(eq(journalEntryModel.id, id))
      .returning()

    return result.length > 0
  }
}

export const journalEntryRepository = new JournalEntryRepository()
