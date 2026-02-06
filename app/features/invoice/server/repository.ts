import { and, count, desc, eq, max, sql } from 'drizzle-orm'
import { db } from '~/server/db'
import {
  invoiceModel,
  invoiceLineModel,
  type Invoice,
  type InvoiceLine,
  type InsertInvoice,
  type InsertInvoiceLine,
  type InvoiceStatus,
} from '~/server/db/schemas/invoice'
import { businessPartnerModel } from '~/server/db/schemas/businessPartner'
import { companyModel } from '~/server/db/schemas/company'
import { accountingAccountModel } from '~/server/db/schemas/accounting'
import { productModel } from '~/server/db/schemas/products'

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

  /**
   * Update invoice header fields
   */
  async update(
    id: string,
    data: Partial<Omit<InsertInvoice, 'id' | 'createdAt' | 'organizationId'>>
  ): Promise<Invoice | null> {
    const [updated] = await db
      .update(invoiceModel)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(invoiceModel.id, id))
      .returning()

    return updated ?? null
  }

  /**
   * Update invoice status
   */
  async updateStatus(id: string, status: InvoiceStatus): Promise<Invoice | null> {
    const [updated] = await db
      .update(invoiceModel)
      .set({
        status,
        updatedAt: new Date(),
      })
      .where(eq(invoiceModel.id, id))
      .returning()

    return updated ?? null
  }

  /**
   * Add a line to an existing invoice
   */
  async addLine(
    invoiceId: string,
    line: Omit<InsertInvoiceLine, 'id' | 'invoiceId' | 'createdAt' | 'updatedAt'>
  ): Promise<InvoiceLine> {
    return await db.transaction(async (tx) => {
      // Get the next line number
      const [maxLine] = await tx
        .select({ maxLineNumber: max(invoiceLineModel.lineNumber) })
        .from(invoiceLineModel)
        .where(eq(invoiceLineModel.invoiceId, invoiceId))

      const nextLineNumber = (maxLine?.maxLineNumber ?? 0) + 1

      // Insert the new line
      const [newLine] = await tx
        .insert(invoiceLineModel)
        .values({
          ...line,
          invoiceId,
          lineNumber: line.lineNumber ?? nextLineNumber,
        })
        .returning()

      // Recalculate invoice totals
      await this.recalculateTotals(tx, invoiceId)

      return newLine
    })
  }

  /**
   * Update a line in an existing invoice
   */
  async updateLine(
    lineId: string,
    data: Partial<Omit<InsertInvoiceLine, 'id' | 'invoiceId' | 'createdAt' | 'updatedAt'>>
  ): Promise<InvoiceLine | null> {
    return await db.transaction(async (tx) => {
      const [updated] = await tx
        .update(invoiceLineModel)
        .set({
          ...data,
          updatedAt: new Date(),
        })
        .where(eq(invoiceLineModel.id, lineId))
        .returning()

      if (updated) {
        // Recalculate invoice totals
        await this.recalculateTotals(tx, updated.invoiceId)
      }

      return updated ?? null
    })
  }

  /**
   * Remove a line from an invoice
   */
  async removeLine(lineId: string): Promise<boolean> {
    return await db.transaction(async (tx) => {
      // First get the invoice id
      const [line] = await tx
        .select({ invoiceId: invoiceLineModel.invoiceId })
        .from(invoiceLineModel)
        .where(eq(invoiceLineModel.id, lineId))
        .limit(1)

      if (!line) return false

      // Delete the line
      await tx.delete(invoiceLineModel).where(eq(invoiceLineModel.id, lineId))

      // Recalculate invoice totals
      await this.recalculateTotals(tx, line.invoiceId)

      return true
    })
  }

  /**
   * Recalculate invoice totals based on lines
   */
  private async recalculateTotals(
    tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
    invoiceId: string
  ): Promise<void> {
    const [totals] = await tx
      .select({
        subtotal: sql<string>`COALESCE(SUM(${invoiceLineModel.subtotal}), 0)`,
        ivaAmount: sql<string>`COALESCE(SUM(${invoiceLineModel.ivaAmount}), 0)`,
        total: sql<string>`COALESCE(SUM(${invoiceLineModel.total}), 0)`,
      })
      .from(invoiceLineModel)
      .where(eq(invoiceLineModel.invoiceId, invoiceId))

    await tx
      .update(invoiceModel)
      .set({
        subtotal: totals?.subtotal ?? '0',
        ivaAmount: totals?.ivaAmount ?? '0',
        total: totals?.total ?? '0',
        updatedAt: new Date(),
      })
      .where(eq(invoiceModel.id, invoiceId))
  }

  /**
   * Get lines for an invoice with product info
   */
  async getLinesWithProducts(invoiceId: string): Promise<
    (InvoiceLine & {
      product: { id: string; sku: string; name: string; price: string | null } | null
      accountingAccount: { id: string; name: string | null; accountNumber: string | null } | null
    })[]
  > {
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
        product: {
          id: productModel.id,
          sku: productModel.sku,
          name: productModel.name,
          price: productModel.price,
        },
        accountingAccount: {
          id: accountingAccountModel.id,
          name: accountingAccountModel.name,
          accountNumber: accountingAccountModel.accountNumber,
        },
      })
      .from(invoiceLineModel)
      .leftJoin(productModel, eq(invoiceLineModel.productId, productModel.id))
      .leftJoin(
        accountingAccountModel,
        eq(invoiceLineModel.accountingAccountId, accountingAccountModel.id)
      )
      .where(eq(invoiceLineModel.invoiceId, invoiceId))
      .orderBy(invoiceLineModel.lineNumber)

    return lines
  }

  /**
   * Get invoice by ID with all related data for viewing/editing
   */
  async getByIdWithDetails(id: string): Promise<
    | (Invoice & {
        lines: (InvoiceLine & {
          product: { id: string; sku: string; name: string; price: string | null } | null
          accountingAccount: { id: string; name: string | null; accountNumber: string | null } | null
        })[]
        businessPartner: { id: string; name: string; nit: string | null } | null
        company: { id: string; name: string } | null
      })
    | null
  > {
    const [invoice] = await db
      .select()
      .from(invoiceModel)
      .where(eq(invoiceModel.id, id))
      .limit(1)

    if (!invoice) return null

    const lines = await this.getLinesWithProducts(id)

    const [businessPartner] = await db
      .select({
        id: businessPartnerModel.id,
        name: businessPartnerModel.name,
        nit: businessPartnerModel.nit,
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
      businessPartner: businessPartner ?? null,
      company: company ?? null,
    }
  }

  /**
   * Delete an invoice (only if draft)
   */
  async delete(id: string): Promise<boolean> {
    const result = await db
      .delete(invoiceModel)
      .where(and(eq(invoiceModel.id, id), eq(invoiceModel.status, 'draft')))
      .returning()

    return result.length > 0
  }
}

export const invoiceRepository = new InvoiceRepository()
