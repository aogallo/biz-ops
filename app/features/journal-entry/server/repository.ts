import { and, count, desc, eq, gte, lte, sql } from 'drizzle-orm'
import { db } from '~/server/db'
import { accountingAccountModel } from '~/server/db/schemas/accounting'
import { companyModel } from '~/server/db/schemas/company'
import {
  journalEntryLineModel,
  journalEntryModel,
  type InsertJournalEntry,
  type InsertJournalEntryLine,
  type JournalEntry,
  type JournalEntryLine,
} from '~/server/db/schemas/journalEntry'

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

export interface GetForReportOptions {
  companyId?: string
  dateFrom?: Date
  dateTo?: Date
  limit?: number
  offset?: number
}

export interface PdfExportEntry {
  id: string
  entryNumber: string
  entryDate: Date
  description: string
  companyName: string
  lines: {
    accountNumber: string | null
    accountName: string | null
    description: string | null
    debitAmount: string | null
    creditAmount: string | null
  }[]
}

export interface ReportLineItem {
  id: string
  date: string
  refNo: string
  accountName: string
  description: string
  debit: number
  credit: number
}

export interface ReportResult {
  data: ReportLineItem[]
  total: number
  totalDebit: number
  totalCredit: number
}

export class JournalEntryRepository {
  async create(
    data: Omit<InsertJournalEntry, 'id' | 'createdAt' | 'updatedAt'>,
    lines: Omit<
      InsertJournalEntryLine,
      'id' | 'journalEntryId' | 'createdAt' | 'updatedAt'
    >[]
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
      .orderBy(
        desc(journalEntryModel.entryDate),
        desc(journalEntryModel.createdAt)
      )

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
      .orderBy(
        desc(journalEntryModel.entryDate),
        desc(journalEntryModel.createdAt)
      )
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
    lines: Omit<
      InsertJournalEntryLine,
      'id' | 'journalEntryId' | 'createdAt' | 'updatedAt'
    >[]
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

  async getForReport(
    organizationId: string,
    options: GetForReportOptions = {}
  ): Promise<ReportResult> {
    const { companyId, dateFrom, dateTo, limit = 20, offset = 0 } = options

    // Build conditions for entries
    const conditions = [eq(journalEntryModel.organizationId, organizationId)]

    if (companyId) {
      conditions.push(eq(journalEntryModel.companyId, companyId))
    }

    if (dateFrom) {
      conditions.push(gte(journalEntryModel.entryDate, dateFrom))
    }

    if (dateTo) {
      conditions.push(lte(journalEntryModel.entryDate, dateTo))
    }

    // Get total count of lines for pagination
    const countQuery = await db
      .select({ count: count() })
      .from(journalEntryLineModel)
      .innerJoin(
        journalEntryModel,
        eq(journalEntryLineModel.journalEntryId, journalEntryModel.id)
      )
      .where(and(...conditions))

    const total = countQuery[0]?.count ?? 0

    // Get aggregated totals (debit/credit)
    const totalsQuery = await db
      .select({
        totalDebit: sql<string>`COALESCE(SUM(${journalEntryLineModel.debitAmount}), 0)`,
        totalCredit: sql<string>`COALESCE(SUM(${journalEntryLineModel.creditAmount}), 0)`,
      })
      .from(journalEntryLineModel)
      .innerJoin(
        journalEntryModel,
        eq(journalEntryLineModel.journalEntryId, journalEntryModel.id)
      )
      .where(and(...conditions))

    const totalDebit = Number(totalsQuery[0]?.totalDebit ?? 0)
    const totalCredit = Number(totalsQuery[0]?.totalCredit ?? 0)

    // Get paginated line-level data
    const lines = await db
      .select({
        lineId: journalEntryLineModel.id,
        entryDate: journalEntryModel.entryDate,
        entryNumber: journalEntryModel.entryNumber,
        accountName: accountingAccountModel.name,
        lineDescription: journalEntryLineModel.description,
        entryDescription: journalEntryModel.description,
        debitAmount: journalEntryLineModel.debitAmount,
        creditAmount: journalEntryLineModel.creditAmount,
      })
      .from(journalEntryLineModel)
      .innerJoin(
        journalEntryModel,
        eq(journalEntryLineModel.journalEntryId, journalEntryModel.id)
      )
      .leftJoin(
        accountingAccountModel,
        eq(journalEntryLineModel.accountingAccountId, accountingAccountModel.id)
      )
      .where(and(...conditions))
      .orderBy(
        desc(journalEntryModel.entryDate),
        journalEntryModel.entryNumber,
        journalEntryLineModel.lineNumber
      )
      .limit(limit)
      .offset(offset)

    // Transform to report format
    const data: ReportLineItem[] = lines.map((line) => ({
      id: line.lineId,
      date: line.entryDate
        ? new Date(line.entryDate).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })
        : '',
      refNo: line.entryNumber,
      accountName: line.accountName ?? 'Unknown Account',
      description: line.lineDescription || line.entryDescription,
      debit: Number(line.debitAmount ?? 0),
      credit: Number(line.creditAmount ?? 0),
    }))

    return {
      data,
      total,
      totalDebit,
      totalCredit,
    }
  }

  async getAllForExport(
    organizationId: string,
    options: Omit<GetForReportOptions, 'limit' | 'offset'>
  ): Promise<ReportLineItem[]> {
    const { companyId, dateFrom, dateTo } = options

    // Build conditions for entries
    const conditions = [eq(journalEntryModel.organizationId, organizationId)]

    if (companyId) {
      conditions.push(eq(journalEntryModel.companyId, companyId))
    }

    if (dateFrom) {
      conditions.push(gte(journalEntryModel.entryDate, dateFrom))
    }

    if (dateTo) {
      conditions.push(lte(journalEntryModel.entryDate, dateTo))
    }

    // Get all line-level data without pagination
    const lines = await db
      .select({
        lineId: journalEntryLineModel.id,
        entryDate: journalEntryModel.entryDate,
        entryNumber: journalEntryModel.entryNumber,
        accountName: accountingAccountModel.name,
        lineDescription: journalEntryLineModel.description,
        entryDescription: journalEntryModel.description,
        debitAmount: journalEntryLineModel.debitAmount,
        creditAmount: journalEntryLineModel.creditAmount,
      })
      .from(journalEntryLineModel)
      .innerJoin(
        journalEntryModel,
        eq(journalEntryLineModel.journalEntryId, journalEntryModel.id)
      )
      .leftJoin(
        accountingAccountModel,
        eq(journalEntryLineModel.accountingAccountId, accountingAccountModel.id)
      )
      .where(and(...conditions))
      .orderBy(
        desc(journalEntryModel.entryDate),
        journalEntryLineModel.lineNumber
      )

    // Transform to report format
    return lines.map((line) => ({
      id: line.lineId,
      date: line.entryDate
        ? new Date(line.entryDate).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })
        : '',
      refNo: line.entryNumber,
      accountName: line.accountName ?? 'Unknown Account',
      description: line.lineDescription || line.entryDescription,
      debit: Number(line.debitAmount ?? 0),
      credit: Number(line.creditAmount ?? 0),
    }))
  }

  async getRecentAccounts(
    organizationId: string,
    limit: number = 10
  ): Promise<
    {
      id: string
      accountNumber: string | null
      name: string | null
      usageCount: number
    }[]
  > {
    // Get accounts most frequently used in journal entry lines for this organization
    const results = await db
      .select({
        id: accountingAccountModel.id,
        accountNumber: accountingAccountModel.accountNumber,
        name: accountingAccountModel.name,
        usageCount: count(journalEntryLineModel.id),
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
      .where(eq(journalEntryModel.organizationId, organizationId))
      .groupBy(
        accountingAccountModel.id,
        accountingAccountModel.accountNumber,
        accountingAccountModel.name
      )
      .orderBy(desc(count(journalEntryLineModel.id)))
      .limit(limit)

    return results
  }

  async update(
    id: string,
    data: Partial<
      Omit<InsertJournalEntry, 'id' | 'createdAt' | 'entryNumber'>
    >
  ): Promise<JournalEntry | null> {
    const [updated] = await db
      .update(journalEntryModel)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(journalEntryModel.id, id))
      .returning()

    return updated ?? null
  }

  async getAllForPdfExport(
    organizationId: string,
    options: Omit<GetForReportOptions, 'limit' | 'offset'>
  ): Promise<{ entries: PdfExportEntry[]; companyName: string }> {
    const { companyId, dateFrom, dateTo } = options

    // Build conditions for entries
    const conditions = [eq(journalEntryModel.organizationId, organizationId)]

    if (companyId) {
      conditions.push(eq(journalEntryModel.companyId, companyId))
    }

    if (dateFrom) {
      conditions.push(gte(journalEntryModel.entryDate, dateFrom))
    }

    if (dateTo) {
      conditions.push(lte(journalEntryModel.entryDate, dateTo))
    }

    // Get all entries with company info
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
      .orderBy(journalEntryModel.entryDate, journalEntryModel.entryNumber)

    if (entries.length === 0) {
      return {
        entries: [],
        companyName: '',
      }
    }

    // Get lines for all entries
    const entryIds = entries.map((e) => e.entry.id)
    const allLines = await db
      .select({
        id: journalEntryLineModel.id,
        journalEntryId: journalEntryLineModel.journalEntryId,
        lineNumber: journalEntryLineModel.lineNumber,
        description: journalEntryLineModel.description,
        debitAmount: journalEntryLineModel.debitAmount,
        creditAmount: journalEntryLineModel.creditAmount,
        accountNumber: accountingAccountModel.accountNumber,
        accountName: accountingAccountModel.name,
      })
      .from(journalEntryLineModel)
      .leftJoin(
        accountingAccountModel,
        eq(journalEntryLineModel.accountingAccountId, accountingAccountModel.id)
      )
      .where(
        sql`${journalEntryLineModel.journalEntryId} IN (${sql.join(
          entryIds.map((id) => sql`${id}`),
          sql`, `
        )})`
      )
      .orderBy(journalEntryLineModel.lineNumber)

    // Group lines by entry
    const linesByEntry = allLines.reduce(
      (acc, line) => {
        if (!acc[line.journalEntryId]) {
          acc[line.journalEntryId] = []
        }
        acc[line.journalEntryId].push({
          accountNumber: line.accountNumber,
          accountName: line.accountName,
          description: line.description,
          debitAmount: line.debitAmount,
          creditAmount: line.creditAmount,
        })
        return acc
      },
      {} as Record<
        string,
        {
          accountNumber: string | null
          accountName: string | null
          description: string | null
          debitAmount: string | null
          creditAmount: string | null
        }[]
      >
    )

    // Get company name from first entry
    const companyName = entries[0]?.company?.name || 'Unknown Company'

    // Transform to PDF export format
    const pdfEntries: PdfExportEntry[] = entries.map((e) => ({
      id: e.entry.id,
      entryNumber: e.entry.entryNumber,
      entryDate: e.entry.entryDate,
      description: e.entry.description,
      companyName: e.company?.name || 'Unknown',
      lines: linesByEntry[e.entry.id] || [],
    }))

    return {
      entries: pdfEntries,
      companyName,
    }
  }
}

export const journalEntryRepository = new JournalEntryRepository()
