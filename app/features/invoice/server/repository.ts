import { and, count, desc, eq, sql } from 'drizzle-orm'
import { db } from '~/server/db'
import {
  invoiceModel,
  invoiceLineModel,
  type Invoice,
  type InvoiceLine,
  type InsertInvoice,
  type InsertInvoiceLine,
} from '~/server/db/schemas/invoice'
import { businessPartnerModel } from '~/server/db/schemas/businessPartner'
import { companyModel } from '~/server/db/schemas/company'
import { accountingAccountModel } from '~/server/db/schemas/accounting'

export interface InvoiceWithLines extends Invoice {
  lines: (InvoiceLine & {
    accountingAccount: {
      id: string
      name: string | null
      accountNumber: string | null
    } | null
  })[]
  businessPartner?: {
    id: string
    name: string
  } | null
  company?: {
    id: string
    name: string
  } | null
}

export interface GetInvoicesOptions {
  companyId?: string
  type?: 'purchase' | 'sale'
  status?: 'draft' | 'pending' | 'posted' | 'voided'
  limit?: number
  offset?: number
}

export class InvoiceRepository {
  async create(
    data: Omit<InsertInvoice, 'id' | 'createdAt' | 'updatedAt'>,
    lines?: Omit<InsertInvoiceLine, 'id' | 'invoiceId' | 'createdAt' | 'updatedAt'>[]
  ): Promise<Invoice> {
    return await db.transaction(async (tx) => {
      const [invoice] = await tx
        .insert(invoiceModel)
        .values(data)
        .returning()

      if (lines && lines.length > 0) {
        await tx.insert(invoiceLineModel).values(
          lines.map((line, index) => ({
            ...line,
            invoiceId: invoice.id,
            lineNumber: line.lineNumber ?? index + 1,
          }))
        )
      }

      return invoice
    })
  }

  async getById(id: string): Promise<InvoiceWithLines | null> {
    const [invoice] = await db
      .select()
      .from(invoiceModel)
      .where(eq(invoiceModel.id, id))
      .limit(1)

    if (!invoice) return null

    const lines = await db
      .select({
        id: invoiceLineModel.id,
        invoiceId: invoiceLineModel.invoiceId,
        lineNumber: invoiceLineModel.lineNumber,
        description: invoiceLineModel.description,
        quantity: invoiceLineModel.quantity,
        unitPrice: invoiceLineModel.unitPrice,
        subtotal: invoiceLineModel.subtotal,
        ivaType: invoiceLineModel.ivaType,
        ivaRate: invoiceLineModel.ivaRate,
        ivaAmount: invoiceLineModel.ivaAmount,
        total: invoiceLineModel.total,
        productId: invoiceLineModel.productId,
        accountingAccountId: invoiceLineModel.accountingAccountId,
        createdAt: invoiceLineModel.createdAt,
        updatedAt: invoiceLineModel.updatedAt,
        accountingAccount: {
          id: accountingAccountModel.id,
          name: accountingAccountModel.name,
          accountNumber: accountingAccountModel.accountNumber,
        },
      })
      .from(invoiceLineModel)
      .leftJoin(
        accountingAccountModel,
        eq(invoiceLineModel.accountingAccountId, accountingAccountModel.id)
      )
      .where(eq(invoiceLineModel.invoiceId, id))
      .orderBy(invoiceLineModel.lineNumber)

    const [businessPartner] = await db
      .select({
        id: businessPartnerModel.id,
        name: businessPartnerModel.name,
      })
      .from(businessPartnerModel)
      .where(eq(businessPartnerModel.id, invoice.businessPartnerId))
      .limit(1)

    const [company] = await db
      .select({
        id: companyModel.id,
        name: companyModel.name,
      })
      .from(companyModel)
      .where(eq(companyModel.id, invoice.companyId))
      .limit(1)

    return {
      ...invoice,
      lines,
      businessPartner,
      company,
    }
  }

  async getPaginated(
    organizationId: string,
    options: GetInvoicesOptions = {}
  ): Promise<{ invoices: InvoiceWithLines[]; total: number }> {
    const { companyId, type, status, limit = 10, offset = 0 } = options

    const conditions = [eq(invoiceModel.organizationId, organizationId)]

    if (companyId) {
      conditions.push(eq(invoiceModel.companyId, companyId))
    }

    if (type) {
      conditions.push(eq(invoiceModel.type, type))
    }

    if (status) {
      conditions.push(eq(invoiceModel.status, status))
    }

    // Get total count
    const [{ count: total }] = await db
      .select({ count: count() })
      .from(invoiceModel)
      .where(and(...conditions))

    // Get invoices
    const invoices = await db
      .select({
        invoice: invoiceModel,
        businessPartner: {
          id: businessPartnerModel.id,
          name: businessPartnerModel.name,
        },
        company: {
          id: companyModel.id,
          name: companyModel.name,
        },
      })
      .from(invoiceModel)
      .leftJoin(
        businessPartnerModel,
        eq(invoiceModel.businessPartnerId, businessPartnerModel.id)
      )
      .leftJoin(companyModel, eq(invoiceModel.companyId, companyModel.id))
      .where(and(...conditions))
      .orderBy(desc(invoiceModel.invoiceDate), desc(invoiceModel.createdAt))
      .limit(limit)
      .offset(offset)

    // Get lines for all invoices
    const invoiceIds = invoices.map((i) => i.invoice.id)
    const allLines =
      invoiceIds.length > 0
        ? await db
            .select({
              id: invoiceLineModel.id,
              invoiceId: invoiceLineModel.invoiceId,
              lineNumber: invoiceLineModel.lineNumber,
              description: invoiceLineModel.description,
              quantity: invoiceLineModel.quantity,
              unitPrice: invoiceLineModel.unitPrice,
              subtotal: invoiceLineModel.subtotal,
              ivaType: invoiceLineModel.ivaType,
              ivaRate: invoiceLineModel.ivaRate,
              ivaAmount: invoiceLineModel.ivaAmount,
              total: invoiceLineModel.total,
              productId: invoiceLineModel.productId,
              accountingAccountId: invoiceLineModel.accountingAccountId,
              createdAt: invoiceLineModel.createdAt,
              updatedAt: invoiceLineModel.updatedAt,
              accountingAccount: {
                id: accountingAccountModel.id,
                name: accountingAccountModel.name,
                accountNumber: accountingAccountModel.accountNumber,
              },
            })
            .from(invoiceLineModel)
            .leftJoin(
              accountingAccountModel,
              eq(invoiceLineModel.accountingAccountId, accountingAccountModel.id)
            )
            .where(
              sql`${invoiceLineModel.invoiceId} IN (${sql.join(
                invoiceIds.map((id) => sql`${id}`),
                sql`, `
              )})`
            )
            .orderBy(invoiceLineModel.lineNumber)
        : []

    // Group lines by invoice
    const linesByInvoice = allLines.reduce(
      (acc, line) => {
        if (!acc[line.invoiceId]) {
          acc[line.invoiceId] = []
        }
        acc[line.invoiceId].push(line)
        return acc
      },
      {} as Record<string, typeof allLines>
    )

    const invoicesWithLines: InvoiceWithLines[] = invoices.map((i) => ({
      ...i.invoice,
      lines: linesByInvoice[i.invoice.id] || [],
      businessPartner: i.businessPartner,
      company: i.company,
    }))

    return {
      invoices: invoicesWithLines,
      total,
    }
  }

  async getBySatFileId(satFileId: string): Promise<Invoice | null> {
    const [invoice] = await db
      .select()
      .from(invoiceModel)
      .where(eq(invoiceModel.satFileId, satFileId))
      .limit(1)

    return invoice ?? null
  }

  async updateLineAccount(
    invoiceId: string,
    accountingAccountId: string
  ): Promise<void> {
    await db
      .update(invoiceLineModel)
      .set({
        accountingAccountId,
        updatedAt: new Date(),
      })
      .where(eq(invoiceLineModel.invoiceId, invoiceId))
  }
}

export const invoiceRepository = new InvoiceRepository()
