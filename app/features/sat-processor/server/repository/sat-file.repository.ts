import { and, count, eq, ilike, isNotNull, or, sql } from 'drizzle-orm'
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
  limit?: number
  offset?: number
}

export interface CategorizeStats {
  total: number
  matched: number
  review: number
}

export class SatFileRepository {
  async getByOrganization(
    organizationId: string,
    options: GetSatFilesOptions = {}
  ): Promise<SatFile[]> {
    const { search, limit = 50, offset = 0 } = options

    const conditions = [eq(satFileModel.organizationId, organizationId)]

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

    return await db
      .select()
      .from(satFileModel)
      .where(and(...conditions))
      .limit(limit)
      .offset(offset)
      .orderBy(sql`${satFileModel.date} DESC`)
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

  async updateAccountingAccount(
    id: string,
    accountingAccountId: string | null
  ): Promise<SatFile | null> {
    const [updated] = await db
      .update(satFileModel)
      .set({ accountingAccountId })
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
