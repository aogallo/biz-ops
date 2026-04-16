import { and, count, desc, eq, gte, lt, min } from 'drizzle-orm'
import { db } from '~/server/db'
import { invoiceModel } from '~/server/db/schemas/invoice'
import { journalEntryModel } from '~/server/db/schemas/journalEntry'
import { businessPartnerModel } from '~/server/db/schemas/businessPartner'

export interface HomeActivity {
  id: string
  icon: 'invoice' | 'payment' | 'client'
  title: string
  subtitle: string
  createdAt: Date
}

export class HomeRepository {
  async getOverdueInvoicesCount(organizationId: string): Promise<number> {
    const today = new Date().toISOString().split('T')[0]
    const [result] = await db
      .select({ count: count() })
      .from(invoiceModel)
      .where(
        and(
          eq(invoiceModel.organizationId, organizationId),
          eq(invoiceModel.type, 'sale'),
          eq(invoiceModel.status, 'pending'),
          lt(invoiceModel.dueDate, today)
        )
      )
    return result?.count ?? 0
  }

  async getPendingPayablesCount(organizationId: string): Promise<number> {
    const [result] = await db
      .select({ count: count() })
      .from(invoiceModel)
      .where(
        and(
          eq(invoiceModel.organizationId, organizationId),
          eq(invoiceModel.type, 'purchase'),
          eq(invoiceModel.status, 'pending')
        )
      )
    return result?.count ?? 0
  }

  async getNextPendingPayableDueDays(
    organizationId: string
  ): Promise<number | null> {
    const today = new Date().toISOString().split('T')[0]
    const [result] = await db
      .select({ minDueDate: min(invoiceModel.dueDate) })
      .from(invoiceModel)
      .where(
        and(
          eq(invoiceModel.organizationId, organizationId),
          eq(invoiceModel.type, 'purchase'),
          eq(invoiceModel.status, 'pending'),
          gte(invoiceModel.dueDate, today)
        )
      )

    if (!result?.minDueDate) return null

    const dueDate = new Date(`${result.minDueDate}T00:00:00`)
    const todayDate = new Date(`${today}T00:00:00`)
    const diffMs = dueDate.getTime() - todayDate.getTime()
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24))
  }

  async getRecentInvoiceActivity(
    organizationId: string,
    limit: number
  ): Promise<HomeActivity[]> {
    const invoices = await db
      .select({
        id: invoiceModel.id,
        number: invoiceModel.number,
        type: invoiceModel.type,
        createdAt: invoiceModel.createdAt,
      })
      .from(invoiceModel)
      .where(eq(invoiceModel.organizationId, organizationId))
      .orderBy(desc(invoiceModel.createdAt))
      .limit(limit)

    return invoices.map((inv) => ({
      id: inv.id,
      icon: 'invoice' as const,
      title: `Invoice #${inv.number} created`,
      subtitle: inv.type === 'sale' ? 'Sale invoice' : 'Purchase invoice',
      createdAt: inv.createdAt,
    }))
  }

  async getRecentJournalEntryActivity(
    organizationId: string,
    limit: number
  ): Promise<HomeActivity[]> {
    const entries = await db
      .select({
        id: journalEntryModel.id,
        entryNumber: journalEntryModel.entryNumber,
        description: journalEntryModel.description,
        createdAt: journalEntryModel.createdAt,
      })
      .from(journalEntryModel)
      .where(eq(journalEntryModel.organizationId, organizationId))
      .orderBy(desc(journalEntryModel.createdAt))
      .limit(limit)

    return entries.map((entry) => ({
      id: entry.id,
      icon: 'payment' as const,
      title: `Journal entry #${entry.entryNumber}`,
      subtitle: entry.description,
      createdAt: entry.createdAt,
    }))
  }

  async getRecentBusinessPartnerActivity(
    organizationId: string,
    limit: number
  ): Promise<HomeActivity[]> {
    const partners = await db
      .select({
        id: businessPartnerModel.id,
        name: businessPartnerModel.name,
        type: businessPartnerModel.type,
        createdAt: businessPartnerModel.createdAt,
      })
      .from(businessPartnerModel)
      .where(eq(businessPartnerModel.organizationId, organizationId))
      .orderBy(desc(businessPartnerModel.createdAt))
      .limit(limit)

    return partners.map((partner) => ({
      id: partner.id,
      icon: 'client' as const,
      title: `"${partner.name}" added`,
      subtitle:
        partner.type === 'vendor' ? 'New vendor record' : 'New client record',
      createdAt: partner.createdAt,
    }))
  }
}

export const homeRepository = new HomeRepository()
