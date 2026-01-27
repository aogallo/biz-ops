import { and, count, eq, ne } from 'drizzle-orm'
import { db } from '~/server/db'
import { accountingAccountModel } from '~/server/db/schemas/accounting'
import type { CreateAccountInput, CsvAccountRow } from '../schemas'

export interface UpsertResult {
  inserted: number
  updated: number
  skipped: number
  errors: Array<{ row: number; accountNumber: string; message: string }>
  totalRows: number
}

export interface PaginatedResult<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

const BATCH_SIZE = 500

export class AccountsRepository {
  /**
   * Create a new account
   */
  async create(data: CreateAccountInput) {
    const [account] = await db
      .insert(accountingAccountModel)
      .values(data)
      .returning()
    return account
  }

  /**
   * Get all accounts for an organization
   */
  async getAllByOrganization(organizationId: string) {
    return await db
      .select()
      .from(accountingAccountModel)
      .where(eq(accountingAccountModel.organizationId, organizationId))
      .orderBy(accountingAccountModel.accountNumber)
  }

  /**
   * Get paginated accounts for an organization
   */
  async getPaginated(
    organizationId: string,
    { page = 1, pageSize = 10 }: { page?: number; pageSize?: number }
  ): Promise<PaginatedResult<typeof accountingAccountModel.$inferSelect>> {
    const offset = (page - 1) * pageSize

    const [items, totalResult] = await Promise.all([
      db
        .select()
        .from(accountingAccountModel)
        .where(eq(accountingAccountModel.organizationId, organizationId))
        .orderBy(accountingAccountModel.accountNumber)
        .limit(pageSize)
        .offset(offset),
      db
        .select({ count: count() })
        .from(accountingAccountModel)
        .where(eq(accountingAccountModel.organizationId, organizationId)),
    ])

    const total = totalResult[0]?.count ?? 0
    const totalPages = Math.ceil(total / pageSize)

    return {
      items,
      total,
      page,
      pageSize,
      totalPages,
    }
  }

  /**
   * Get account by ID (for internal operations)
   */
  async getById(id: string) {
    const [account] = await db
      .select()
      .from(accountingAccountModel)
      .where(eq(accountingAccountModel.id, id))
      .limit(1)

    return account || null
  }

  /**
   * Get account by ID for a specific organization (secure access)
   */
  async getByIdForOrganization(organizationId: string, id: string) {
    const [account] = await db
      .select()
      .from(accountingAccountModel)
      .where(
        and(
          eq(accountingAccountModel.id, id),
          eq(accountingAccountModel.organizationId, organizationId)
        )
      )
      .limit(1)

    return account || null
  }

  /**
   * Get account by account number within organization (business key lookup)
   */
  async getByAccountNumber(organizationId: string, accountNumber: string) {
    const [account] = await db
      .select()
      .from(accountingAccountModel)
      .where(
        and(
          eq(accountingAccountModel.organizationId, organizationId),
          eq(accountingAccountModel.accountNumber, accountNumber)
        )
      )
      .limit(1)

    return account || null
  }

  /**
   * Update account
   */
  async update(id: string, data: Partial<CreateAccountInput>) {
    const [account] = await db
      .update(accountingAccountModel)
      .set(data)
      .where(eq(accountingAccountModel.id, id))
      .returning()

    return account || null
  }

  /**
   * Delete account
   */
  async delete(id: string) {
    try {
      await db
        .delete(accountingAccountModel)
        .where(eq(accountingAccountModel.id, id))
      return true
    } catch {
      return false
    }
  }

  /**
   * Check if account number exists in organization (for uniqueness validation)
   */
  async existsByAccountNumber(
    organizationId: string,
    accountNumber: string,
    excludeId?: string
  ) {
    const conditions = excludeId
      ? and(
          eq(accountingAccountModel.organizationId, organizationId),
          eq(accountingAccountModel.accountNumber, accountNumber),
          ne(accountingAccountModel.id, excludeId)
        )
      : and(
          eq(accountingAccountModel.organizationId, organizationId),
          eq(accountingAccountModel.accountNumber, accountNumber)
        )

    const [account] = await db
      .select({ id: accountingAccountModel.id })
      .from(accountingAccountModel)
      .where(conditions)
      .limit(1)

    return !!account
  }

  /**
   * Bulk upsert accounts - update existing (by accountNumber) or insert new
   */
  async upsertMany(
    organizationId: string,
    records: CsvAccountRow[]
  ): Promise<UpsertResult> {
    const result: UpsertResult = {
      inserted: 0,
      updated: 0,
      skipped: 0,
      errors: [],
      totalRows: records.length,
    }

    // Process in batches
    for (let i = 0; i < records.length; i += BATCH_SIZE) {
      const batch = records.slice(i, i + BATCH_SIZE)

      for (let j = 0; j < batch.length; j++) {
        const record = batch[j]
        const rowNumber = i + j + 2 // +1 for header, +1 for 1-based index

        try {
          // Check if account exists
          const existing = await this.getByAccountNumber(
            organizationId,
            record.accountNumber
          )

          if (existing) {
            // Update existing account
            await this.update(existing.id, {
              name: record.name,
            })
            result.updated++
          } else {
            // Insert new account
            await this.create({
              organizationId,
              accountNumber: record.accountNumber,
              name: record.name,
            })
            result.inserted++
          }
        } catch (error) {
          result.errors.push({
            row: rowNumber,
            accountNumber: record.accountNumber,
            message:
              error instanceof Error ? error.message : 'Unknown error occurred',
          })
          result.skipped++
        }
      }
    }

    return result
  }
}

export const accountsRepository = new AccountsRepository()
