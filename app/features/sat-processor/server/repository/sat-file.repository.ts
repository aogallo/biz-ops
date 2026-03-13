import {
  and,
  count,
  eq,
  gte,
  ilike,
  inArray,
  isNotNull,
  isNull,
  lte,
  or,
  sql,
} from 'drizzle-orm'
import { db } from '~/server/db'
import {
  insertSatFileSchema,
  satFileModel,
  type SatFile,
} from '~/server/db/schemas/sat-file'
import type { z } from 'zod'

type InsertSatFile = z.infer<typeof insertSatFileSchema>

export interface GetSatFilesOptions {
  search?: string
  companyId?: string
  limit?: number
  offset?: number
  dateFrom?: string
  dateTo?: string
}

export interface CategorizeStats {
  total: number
  matched: number
  review: number
}

export class SatFileRepository {
  private buildConditions(
    organizationId: string,
    options: GetSatFilesOptions,
    pendingRows?: boolean
  ) {
    const { search, companyId, dateFrom, dateTo } = options
    const conditions = [eq(satFileModel.organizationId, organizationId)]

    if (pendingRows === true) {
      conditions.push(isNull(satFileModel.accountingAccountId))
    } else if (pendingRows === false) {
      conditions.push(isNotNull(satFileModel.accountingAccountId))
    }

    if (companyId) conditions.push(eq(satFileModel.companyId, companyId))
    if (dateFrom) conditions.push(gte(satFileModel.date, dateFrom))
    if (dateTo) conditions.push(lte(satFileModel.date, dateTo))

    if (search) {
      conditions.push(
        or(
          ilike(satFileModel.emitterName, `%${search}%`),
          ilike(satFileModel.emitterNit, `%${search}%`),
          ilike(satFileModel.serie, `%${search}%`),
          ilike(satFileModel.authorizationNumber, `%${search}%`)
        )!
      )
    }

    return conditions
  }

  async getByOrganization(
    organizationId: string,
    options: GetSatFilesOptions = {},
    pendingRows?: boolean
  ): Promise<SatFile[]> {
    const { limit = 50, offset = 0 } = options
    const conditions = this.buildConditions(
      organizationId,
      options,
      pendingRows
    )

    return await db
      .select()
      .from(satFileModel)
      .where(and(...conditions))
      .limit(limit)
      .offset(offset)
      .orderBy(sql`${satFileModel.date} DESC`)
  }

  async countByOrganization(
    organizationId: string,
    options: GetSatFilesOptions = {},
    pendingRows?: boolean
  ): Promise<number> {
    const conditions = this.buildConditions(
      organizationId,
      options,
      pendingRows
    )
    const [result] = await db
      .select({ count: count() })
      .from(satFileModel)
      .where(and(...conditions))
    return result?.count ?? 0
  }

  async getCategorizeStats(organizationId: string): Promise<CategorizeStats> {
    const [totalResult] = await db
      .select({ count: count() })
      .from(satFileModel)
      .where(eq(satFileModel.organizationId, organizationId))

    const [matchedResult] = await db
      .select({ count: count() })
      .from(satFileModel)
      .where(
        and(
          eq(satFileModel.organizationId, organizationId),
          isNotNull(satFileModel.accountingAccountId)
        )
      )

    const total = totalResult?.count ?? 0
    const matched = matchedResult?.count ?? 0

    return {
      total,
      matched,
      review: total - matched,
    }
  }

  async createMany(records: InsertSatFile[]): Promise<SatFile[]> {
    if (records.length === 0) return []

    return await db.insert(satFileModel).values(records).returning()
  }

  /**
   * Upsert SAT file records.
   * - If record exists and has accountingAccountId: update the accountingAccountId
   * - If record exists and no accountingAccountId: skip (do nothing)
   * - If record doesn't exist: insert as new
   */
  async upsertMany(
    records: InsertSatFile[],
    options: { updateAccountingAccount: boolean } = {
      updateAccountingAccount: false,
    }
  ): Promise<{ inserted: number; updated: number; skipped: number }> {
    if (records.length === 0) return { inserted: 0, updated: 0, skipped: 0 }

    const BATCH_SIZE = 500
    let totalInserted = 0
    let totalUpdated = 0

    for (let i = 0; i < records.length; i += BATCH_SIZE) {
      const batch = records.slice(i, i + BATCH_SIZE)

      // Build unique keys for all records in this batch
      const keys = batch.map((r) => ({
        date: r.date!,
        authorizationNumber: r.authorizationNumber!,
        dteType: r.dteType!,
        serie: r.serie!,
        dteNumber: r.dteNumber!,
      }))

      // Find existing records
      const existingRecords = await this.findByUniqueKeys(
        batch[0].organizationId!,
        batch[0].companyId!,
        keys
      )

      // Build a map of existing records by composite key
      const existingMap = new Map<string, SatFile>()
      for (const record of existingRecords) {
        const key = `${record.date}|${record.authorizationNumber}|${record.dteType}|${record.serie}|${record.dteNumber}`
        existingMap.set(key, record)
      }

      // Separate into records to insert and records to update
      const toInsert: InsertSatFile[] = []
      const toUpdate: { id: string; accountingAccountId: string }[] = []

      for (const record of batch) {
        const key = `${record.date}|${record.authorizationNumber}|${record.dteType}|${record.serie}|${record.dteNumber}`
        const existingRecord = existingMap.get(key)

        if (existingRecord) {
          // Record exists - conditionally update accountingAccountId
          if (
            options.updateAccountingAccount &&
            record.accountingAccountId != null
          ) {
            toUpdate.push({
              id: existingRecord.id,
              accountingAccountId: record.accountingAccountId,
            })
          }
          // If no accountingAccountId or not updating, just skip (counted as skipped)
        } else {
          // Record doesn't exist - insert it
          toInsert.push(record)
        }
      }

      // Bulk insert new records
      if (toInsert.length > 0) {
        const result = await db
          .insert(satFileModel)
          .values(toInsert)
          .onConflictDoNothing()
          .returning()

        totalInserted += result.length
      }

      // Update existing records with new accountingAccountId
      for (const update of toUpdate) {
        await db
          .update(satFileModel)
          .set({
            accountingAccountId: update.accountingAccountId,
            updatedAt: new Date(),
          })
          .where(eq(satFileModel.id, update.id))

        totalUpdated++
      }
    }

    const skipped = records.length - totalInserted - totalUpdated

    return {
      inserted: totalInserted,
      updated: totalUpdated,
      skipped,
    }
  }

  /**
   * Find existing records by their unique key combination
   */
  async findByUniqueKeys(
    organizationId: string,
    companyId: string,
    keys: Array<{
      date: string
      authorizationNumber: string
      dteType: string
      serie: string
      dteNumber: string
    }>
  ): Promise<SatFile[]> {
    if (keys.length === 0) return []

    // Build a composite key for efficient lookup
    const compositeKeys = keys.map(
      (k) =>
        `${k.date}|${k.authorizationNumber}|${k.dteType}|${k.serie}|${k.dteNumber}`
    )

    // Query all records for this org/company and filter in memory for complex key matching
    // This is more efficient than building complex OR conditions
    const allRecords = await db
      .select()
      .from(satFileModel)
      .where(
        and(
          eq(satFileModel.organizationId, organizationId),
          eq(satFileModel.companyId, companyId),
          inArray(
            satFileModel.authorizationNumber,
            keys.map((k) => k.authorizationNumber)
          )
        )
      )

    // Filter to exact matches
    const keySet = new Set(compositeKeys)
    return allRecords.filter((r) => {
      const compositeKey = `${r.date}|${r.authorizationNumber}|${r.dteType}|${r.serie}|${r.dteNumber}`
      return keySet.has(compositeKey)
    })
  }

  async updateAccountingAccount(
    id: string,
    accountingAccountId: string | null,
    itemType?: 'goods' | 'services' | null
  ): Promise<SatFile | null> {
    const updateData: Partial<typeof satFileModel.$inferInsert> = {
      accountingAccountId,
    }
    if (itemType !== undefined) updateData.itemType = itemType

    const [updated] = await db
      .update(satFileModel)
      .set(updateData)
      .where(eq(satFileModel.id, id))
      .returning()

    return updated ?? null
  }

  async getById(id: string): Promise<SatFile | null> {
    const [result] = await db
      .select()
      .from(satFileModel)
      .where(eq(satFileModel.id, id))
      .limit(1)

    return result ?? null
  }

  async deleteByOrganization(organizationId: string): Promise<number> {
    const result = await db
      .delete(satFileModel)
      .where(eq(satFileModel.organizationId, organizationId))
      .returning()

    return result.length
  }
}

export const satFileRepository = new SatFileRepository()
