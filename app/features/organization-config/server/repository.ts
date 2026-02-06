import { eq, sql } from 'drizzle-orm'
import { db } from '~/server/db'
import {
  organizationAccountingConfigModel,
  type InsertOrganizationAccountingConfig,
  type OrganizationAccountingConfig,
  type UpdateOrganizationAccountingConfig,
} from '~/server/db/schemas/organizationConfig'

export class OrganizationConfigRepository {
  async getByOrganizationId(
    organizationId: string
  ): Promise<OrganizationAccountingConfig | null> {
    const [config] = await db
      .select()
      .from(organizationAccountingConfigModel)
      .where(
        eq(organizationAccountingConfigModel.organizationId, organizationId)
      )
      .limit(1)

    return config ?? null
  }

  async getOrCreate(
    organizationId: string
  ): Promise<OrganizationAccountingConfig> {
    const existing = await this.getByOrganizationId(organizationId)
    if (existing) {
      return existing
    }

    const [created] = await db
      .insert(organizationAccountingConfigModel)
      .values({ organizationId })
      .returning()

    return created
  }

  async update(
    organizationId: string,
    data: Partial<
      Omit<UpdateOrganizationAccountingConfig, 'id' | 'organizationId'>
    >
  ): Promise<OrganizationAccountingConfig | null> {
    const [updated] = await db
      .update(organizationAccountingConfigModel)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(
        eq(organizationAccountingConfigModel.organizationId, organizationId)
      )
      .returning()

    return updated ?? null
  }

  async upsert(
    organizationId: string,
    data: Partial<
      Omit<InsertOrganizationAccountingConfig, 'id' | 'organizationId'>
    >
  ): Promise<OrganizationAccountingConfig> {
    const existing = await this.getByOrganizationId(organizationId)

    if (existing) {
      const updated = await this.update(organizationId, data)
      return updated!
    }

    const [created] = await db
      .insert(organizationAccountingConfigModel)
      .values({
        organizationId,
        ...data,
      })
      .returning()

    return created
  }

  /**
   * Get and increment the journal entry number atomically
   */
  async getNextJournalEntryNumber(organizationId: string): Promise<{
    prefix: string
    number: number
    formatted: string
  }> {
    // First ensure config exists
    // const config = await this.getOrCreate(organizationId)

    // Atomically increment and return the number
    const [result] = await db
      .update(organizationAccountingConfigModel)
      .set({
        nextJournalEntryNumber: sql`${organizationAccountingConfigModel.nextJournalEntryNumber} + 1`,
        updatedAt: new Date(),
      })
      .where(
        eq(organizationAccountingConfigModel.organizationId, organizationId)
      )
      .returning()

    // The number returned is the NEW value (after increment), so we need to subtract 1
    const currentNumber = result.nextJournalEntryNumber - 1
    const prefix = result.journalEntryPrefix
    const formatted = `${prefix}-${String(currentNumber).padStart(6, '0')}`

    return {
      prefix,
      number: currentNumber,
      formatted,
    }
  }

  /**
   * Get and increment the manual invoice number atomically
   */
  async getNextManualInvoiceNumber(organizationId: string): Promise<{
    prefix: string
    number: number
    formatted: string
  }> {
    // Atomically increment and return the number
    const [result] = await db
      .update(organizationAccountingConfigModel)
      .set({
        nextManualInvoiceNumber: sql`${organizationAccountingConfigModel.nextManualInvoiceNumber} + 1`,
        updatedAt: new Date(),
      })
      .where(
        eq(organizationAccountingConfigModel.organizationId, organizationId)
      )
      .returning()

    // The number returned is the NEW value (after increment), so we need to subtract 1
    const currentNumber = result.nextManualInvoiceNumber - 1
    const prefix = result.manualInvoicePrefix
    const formatted = `${prefix}-${String(currentNumber).padStart(6, '0')}`

    return {
      prefix,
      number: currentNumber,
      formatted,
    }
  }
}

export const organizationConfigRepository = new OrganizationConfigRepository()
