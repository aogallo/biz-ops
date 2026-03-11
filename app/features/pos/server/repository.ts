import {
  and,
  count,
  desc,
  eq,
  ilike,
  inArray,
  notInArray,
  or,
  sql,
  type SQL,
} from 'drizzle-orm'
import { db } from '~/server/db'
import {
  posTerminalModel,
  posSaleModel,
  posSaleLineModel,
  posPaymentModel,
  posCashierModel,
  posSessionModel,
  posCashMovementModel,
  posZReportModel,
} from '~/server/db/schemas/pos'
import { productModel } from '~/server/db/schemas/products'
import { productCategoryModel } from '~/server/db/schemas/productCategory'
import {
  sucursalModel,
  sucursalInventoryModel,
} from '~/server/db/schemas/sucursal'
import { businessPartnerModel } from '~/server/db/schemas/businessPartner'
import { companyModel } from '~/server/db/schemas/company'
import { userModel } from '~/server/db/schemas/auth'
import type {
  CreateTerminalInput,
  UpdateTerminalInput,
  CreateCashierInput,
  UpdateCashierInput,
} from '../schemas'
import type { PosProductForGrid, PosTerminalWithSucursal } from '../types'

export class PosRepository {
  // ── Terminal CRUD ──

  async getTerminals(
    organizationId: string,
    sucursalId?: string
  ): Promise<PosTerminalWithSucursal[]> {
    const conditions: SQL[] = [
      eq(posTerminalModel.organizationId, organizationId),
    ]
    if (sucursalId) {
      conditions.push(eq(posTerminalModel.sucursalId, sucursalId))
    }

    const terminals = await db
      .select({
        id: posTerminalModel.id,
        name: posTerminalModel.name,
        isActive: posTerminalModel.isActive,
        autoGenerateInvoice: posTerminalModel.autoGenerateInvoice,
        autoPrintReceipt: posTerminalModel.autoPrintReceipt,
        printerName: posTerminalModel.printerName,
        printMethod: posTerminalModel.printMethod,
        sucursalId: posTerminalModel.sucursalId,
        sucursalName: sucursalModel.name,
        defaultBusinessPartnerId: posTerminalModel.defaultBusinessPartnerId,
        companyId: posTerminalModel.companyId,
        companyName: companyModel.name,
      })
      .from(posTerminalModel)
      .leftJoin(
        sucursalModel,
        eq(posTerminalModel.sucursalId, sucursalModel.id)
      )
      .leftJoin(
        companyModel,
        eq(posTerminalModel.companyId, companyModel.id)
      )
      .where(and(...conditions))
      .orderBy(posTerminalModel.name)

    return terminals
  }

  async getTerminalById(id: string) {
    const [terminal] = await db
      .select({
        id: posTerminalModel.id,
        organizationId: posTerminalModel.organizationId,
        sucursalId: posTerminalModel.sucursalId,
        name: posTerminalModel.name,
        isActive: posTerminalModel.isActive,
        autoGenerateInvoice: posTerminalModel.autoGenerateInvoice,
        autoPrintReceipt: posTerminalModel.autoPrintReceipt,
        printerName: posTerminalModel.printerName,
        printMethod: posTerminalModel.printMethod,
        defaultBusinessPartnerId: posTerminalModel.defaultBusinessPartnerId,
        sucursalName: sucursalModel.name,
        companyId: posTerminalModel.companyId,
        companyName: companyModel.name,
      })
      .from(posTerminalModel)
      .leftJoin(
        sucursalModel,
        eq(posTerminalModel.sucursalId, sucursalModel.id)
      )
      .leftJoin(
        companyModel,
        eq(posTerminalModel.companyId, companyModel.id)
      )
      .where(eq(posTerminalModel.id, id))
      .limit(1)

    return terminal ?? null
  }

  async createTerminal(data: CreateTerminalInput) {
    const [terminal] = await db
      .insert(posTerminalModel)
      .values(data)
      .returning()
    return terminal
  }

  async updateTerminal(id: string, data: UpdateTerminalInput) {
    const [terminal] = await db
      .update(posTerminalModel)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(posTerminalModel.id, id))
      .returning()
    return terminal ?? null
  }

  async deleteTerminal(id: string) {
    const result = await db
      .delete(posTerminalModel)
      .where(eq(posTerminalModel.id, id))
      .returning()
    return result.length > 0
  }

  // ── Products for POS ──

  async getProductsForPos(
    organizationId: string,
    sucursalId?: string,
    categoryId?: string,
    search?: string
  ): Promise<PosProductForGrid[]> {
    const conditions: SQL[] = [
      eq(productModel.organizationId, organizationId),
      notInArray(productModel.productType, ['ingredient', 'sale_item']),
    ]

    if (categoryId) {
      conditions.push(eq(productModel.categoryId, categoryId))
    }

    if (search) {
      conditions.push(
        sql`(${ilike(productModel.name, `%${search}%`)} OR ${ilike(productModel.sku, `%${search}%`)})`
      )
    }

    return await db
      .select({
        id: productModel.id,
        name: productModel.name,
        sku: productModel.sku,
        price: productModel.price,
        stock: productModel.stock,
        imageUrl: productModel.imageUrl,
        productType: productModel.productType,
        categoryId: productModel.categoryId,
        categoryName: productCategoryModel.name,
        categoryColor: productCategoryModel.color,
        attributesJson: sql<import('../types').ProductAttributesJson | null>`${productModel.attributesJson}`,
        sucursalStock: sucursalId
          ? sql<number | null>`CAST(${sucursalInventoryModel.stock} AS float8)`
          : sql<number | null>`null`,
        otherSucursalesStock: sucursalId
          ? sql<{ name: string; stock: number }[] | null>`(
              SELECT json_agg(json_build_object('name', s.name, 'stock', si.stock))
              FROM ${sucursalInventoryModel} si
              JOIN ${sucursalModel} s ON s.id = si.sucursal_id
              WHERE si.product_id = ${productModel.id}
                AND si.sucursal_id != ${sucursalId}
                AND si.stock > 0
            )`
          : sql<null>`null`,
      })
      .from(productModel)
      .leftJoin(
        productCategoryModel,
        eq(productModel.categoryId, productCategoryModel.id)
      )
      .leftJoin(
        sucursalInventoryModel,
        sucursalId
          ? and(
              eq(sucursalInventoryModel.productId, productModel.id),
              eq(sucursalInventoryModel.sucursalId, sucursalId)
            )
          : sql`false`
      )
      .where(and(...conditions))
      .orderBy(productModel.name)
  }

  // ── Sales ──

  async getSaleById(id: string) {
    const [sale] = await db
      .select()
      .from(posSaleModel)
      .where(eq(posSaleModel.id, id))
      .limit(1)

    if (!sale) return null

    const [lines, payments, businessPartner, cashier, terminal] =
      await Promise.all([
        db
          .select()
          .from(posSaleLineModel)
          .where(eq(posSaleLineModel.saleId, id))
          .orderBy(posSaleLineModel.lineNumber),
        db.select().from(posPaymentModel).where(eq(posPaymentModel.saleId, id)),
        db
          .select({
            id: businessPartnerModel.id,
            name: businessPartnerModel.name,
            nit: businessPartnerModel.nit,
          })
          .from(businessPartnerModel)
          .where(eq(businessPartnerModel.id, sale.businessPartnerId))
          .limit(1)
          .then((r) => r[0] ?? null),
        db
          .select({ id: posCashierModel.id, name: posCashierModel.name })
          .from(posCashierModel)
          .where(eq(posCashierModel.id, sale.cashierId))
          .limit(1)
          .then((r) => r[0] ?? null),
        db
          .select({ id: posTerminalModel.id, name: posTerminalModel.name, printerName: posTerminalModel.printerName })
          .from(posTerminalModel)
          .where(eq(posTerminalModel.id, sale.terminalId))
          .limit(1)
          .then((r) => r[0] ?? null),
      ])

    return {
      ...sale,
      lines,
      payments,
      businessPartner,
      cashier,
      terminal,
    }
  }

  async getSalesPaginated(
    organizationId: string,
    filters: {
      terminalId?: string
      cashierId?: string
      sessionId?: string
      status?: string
      search?: string
      limit?: number
      offset?: number
    } = {}
  ) {
    const {
      terminalId,
      cashierId,
      sessionId,
      status,
      search,
      limit = 10,
      offset = 0,
    } = filters
    const conditions: SQL[] = [eq(posSaleModel.organizationId, organizationId)]

    if (terminalId) {
      conditions.push(eq(posSaleModel.terminalId, terminalId))
    }
    if (cashierId) {
      conditions.push(eq(posSaleModel.cashierId, cashierId))
    }
    if (sessionId) {
      conditions.push(eq(posSaleModel.sessionId, sessionId))
    }
    if (status) {
      conditions.push(
        eq(posSaleModel.status, status as 'completed' | 'voided' | 'refunded')
      )
    }
    if (search) {
      conditions.push(
        or(
          ilike(posSaleModel.saleNumber, `%${search}%`),
          ilike(businessPartnerModel.nit, `%${search}%`),
          ilike(sql`CAST(${posSaleModel.total} AS TEXT)`, `%${search}%`)
        )!
      )
    }

    const whereClause = and(...conditions)

    const [totalResult] = await db
      .select({ count: count() })
      .from(posSaleModel)
      .innerJoin(
        businessPartnerModel,
        eq(posSaleModel.businessPartnerId, businessPartnerModel.id)
      )
      .where(whereClause)

    const total = totalResult?.count ?? 0

    const sales = await db
      .select({
        id: posSaleModel.id,
        saleNumber: posSaleModel.saleNumber,
        status: posSaleModel.status,
        total: posSaleModel.total,
        currency: posSaleModel.currency,
        createdAt: posSaleModel.createdAt,
        cashierName: posCashierModel.name,
        terminalName: posTerminalModel.name,
        customerName: businessPartnerModel.name,
        customerNit: businessPartnerModel.nit,
      })
      .from(posSaleModel)
      .innerJoin(
        posCashierModel,
        eq(posSaleModel.cashierId, posCashierModel.id)
      )
      .innerJoin(
        posTerminalModel,
        eq(posSaleModel.terminalId, posTerminalModel.id)
      )
      .innerJoin(
        businessPartnerModel,
        eq(posSaleModel.businessPartnerId, businessPartnerModel.id)
      )
      .where(whereClause)
      .orderBy(desc(posSaleModel.createdAt))
      .limit(limit)
      .offset(offset)

    const saleIds = sales.map((s) => s.id)
    const paymentMethodsMap: Record<string, string[]> = {}

    if (saleIds.length > 0) {
      const payments = await db
        .select({
          saleId: posPaymentModel.saleId,
          method: posPaymentModel.method,
        })
        .from(posPaymentModel)
        .where(inArray(posPaymentModel.saleId, saleIds))

      for (const p of payments) {
        if (!paymentMethodsMap[p.saleId]) paymentMethodsMap[p.saleId] = []
        if (!paymentMethodsMap[p.saleId].includes(p.method)) {
          paymentMethodsMap[p.saleId].push(p.method)
        }
      }
    }

    const salesWithPayments = sales.map((s) => ({
      ...s,
      paymentMethods: paymentMethodsMap[s.id] ?? [],
    }))

    return { sales: salesWithPayments, total }
  }

  // ── Business partners for customer search ──

  async searchBusinessPartners(organizationId: string, search: string) {
    return await db
      .select({
        id: businessPartnerModel.id,
        name: businessPartnerModel.name,
        nit: businessPartnerModel.nit,
      })
      .from(businessPartnerModel)
      .where(
        and(
          eq(businessPartnerModel.organizationId, organizationId),
          or(
            ilike(businessPartnerModel.name, `%${search}%`),
            ilike(businessPartnerModel.nit, `%${search}%`)
          )
        )
      )
      .limit(10)
  }

  // ── Categories for filter tabs ──

  async getCategories(organizationId: string) {
    return await db
      .select({
        id: productCategoryModel.id,
        name: productCategoryModel.name,
        color: productCategoryModel.color,
      })
      .from(productCategoryModel)
      .where(eq(productCategoryModel.organizationId, organizationId))
      .orderBy(productCategoryModel.name)
  }
  // ── Cashier CRUD ──

  async getCashiersByOrganization(organizationId: string) {
    return await db
      .select({
        id: posCashierModel.id,
        name: posCashierModel.name,
        userId: posCashierModel.userId,
        userName: userModel.name,
        isActive: posCashierModel.isActive,
      })
      .from(posCashierModel)
      .leftJoin(userModel, eq(posCashierModel.userId, userModel.id))
      .where(eq(posCashierModel.organizationId, organizationId))
      .orderBy(posCashierModel.name)
  }

  async getCashierByUserId(organizationId: string, userId: string) {
    const [cashier] = await db
      .select()
      .from(posCashierModel)
      .where(
        and(
          eq(posCashierModel.organizationId, organizationId),
          eq(posCashierModel.userId, userId),
          eq(posCashierModel.isActive, true)
        )
      )
      .limit(1)
    return cashier ?? null
  }

  async getCashierById(id: string) {
    const [cashier] = await db
      .select()
      .from(posCashierModel)
      .where(eq(posCashierModel.id, id))
      .limit(1)
    return cashier ?? null
  }

  async createCashier(data: CreateCashierInput) {
    const [cashier] = await db.insert(posCashierModel).values(data).returning()
    return cashier
  }

  async updateCashier(id: string, data: UpdateCashierInput) {
    const [cashier] = await db
      .update(posCashierModel)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(posCashierModel.id, id))
      .returning()
    return cashier ?? null
  }

  async deleteCashier(id: string) {
    const result = await db
      .delete(posCashierModel)
      .where(eq(posCashierModel.id, id))
      .returning()
    return result.length > 0
  }

  // ── Session management ──

  async getOpenSession(terminalId: string) {
    const [session] = await db
      .select({
        id: posSessionModel.id,
        terminalId: posSessionModel.terminalId,
        cashierId: posSessionModel.cashierId,
        cashierName: posCashierModel.name,
        openedAt: posSessionModel.openedAt,
        openingCashAmount: posSessionModel.openingCashAmount,
        status: posSessionModel.status,
      })
      .from(posSessionModel)
      .innerJoin(
        posCashierModel,
        eq(posSessionModel.cashierId, posCashierModel.id)
      )
      .where(
        and(
          eq(posSessionModel.terminalId, terminalId),
          eq(posSessionModel.status, 'open')
        )
      )
      .limit(1)
    return session ?? null
  }

  async getOpenSessionByCashier(cashierId: string) {
    const [session] = await db
      .select({
        id: posSessionModel.id,
        terminalId: posSessionModel.terminalId,
        cashierId: posSessionModel.cashierId,
        openedAt: posSessionModel.openedAt,
        status: posSessionModel.status,
      })
      .from(posSessionModel)
      .where(
        and(
          eq(posSessionModel.cashierId, cashierId),
          eq(posSessionModel.status, 'open')
        )
      )
      .limit(1)
    return session ?? null
  }

  async getSessionById(id: string) {
    const [session] = await db
      .select()
      .from(posSessionModel)
      .where(eq(posSessionModel.id, id))
      .limit(1)
    return session ?? null
  }

  async calculateExpectedCashForSession(sessionId: string): Promise<number> {
    const session = await this.getSessionById(sessionId)
    if (!session) throw new Error('Session not found')

    const movements = await db
      .select()
      .from(posCashMovementModel)
      .where(eq(posCashMovementModel.sessionId, sessionId))

    let totalDeposits = 0
    let totalWithdrawals = 0
    let totalRefundMovements = 0

    for (const m of movements) {
      const amt = Number(m.amount)
      if (m.type === 'deposit') totalDeposits += amt
      else if (m.type === 'withdrawal') totalWithdrawals += amt
      else if (m.type === 'refund') totalRefundMovements += amt
    }

    const sales = await db
      .select({ id: posSaleModel.id, status: posSaleModel.status })
      .from(posSaleModel)
      .where(eq(posSaleModel.sessionId, sessionId))

    let totalCashSales = 0
    const completedIds = sales
      .filter((s) => s.status === 'completed')
      .map((s) => s.id)

    if (completedIds.length > 0) {
      const payments = await db
        .select()
        .from(posPaymentModel)
        .where(sql`${posPaymentModel.saleId} IN ${completedIds}`)

      for (const p of payments) {
        if (p.method === 'cash') totalCashSales += Number(p.amount)
      }
    }

    const openingCash = Number(session.openingCashAmount)
    return (
      openingCash +
      totalCashSales -
      totalRefundMovements -
      totalWithdrawals +
      (totalDeposits - openingCash)
    )
  }

  // ── Cash movements ──

  async addCashMovement(data: {
    sessionId: string
    type: 'sale' | 'refund' | 'withdrawal' | 'deposit'
    amount: string
    referenceId?: string
    notes?: string
  }) {
    const [movement] = await db
      .insert(posCashMovementModel)
      .values(data)
      .returning()
    return movement
  }

  async getCashMovementsBySession(sessionId: string) {
    return await db
      .select()
      .from(posCashMovementModel)
      .where(eq(posCashMovementModel.sessionId, sessionId))
      .orderBy(posCashMovementModel.createdAt)
  }

  // ── Z Report ──

  async getZReportBySessionId(sessionId: string) {
    const [report] = await db
      .select()
      .from(posZReportModel)
      .where(eq(posZReportModel.sessionId, sessionId))
      .limit(1)
    return report ?? null
  }

  async getZReportById(id: string) {
    const [report] = await db
      .select()
      .from(posZReportModel)
      .where(eq(posZReportModel.id, id))
      .limit(1)
    return report ?? null
  }

  // ── POS Login ──

  async getActiveSucursales(organizationId: string) {
    return await db
      .select({
        id: sucursalModel.id,
        name: sucursalModel.name,
        code: sucursalModel.code,
        organizationId: sucursalModel.organizationId,
      })
      .from(sucursalModel)
      .where(
        and(
          eq(sucursalModel.organizationId, organizationId),
          eq(sucursalModel.isActive, true)
        )
      )
      .orderBy(sucursalModel.name)
  }

  async getActiveCashiersForSucursal(organizationId: string) {
    return await db
      .select({
        id: posCashierModel.id,
        name: posCashierModel.name,
        userId: posCashierModel.userId,
        hasPin: sql<boolean>`${posCashierModel.pin} IS NOT NULL`,
      })
      .from(posCashierModel)
      .where(
        and(
          eq(posCashierModel.organizationId, organizationId),
          eq(posCashierModel.isActive, true)
        )
      )
      .orderBy(posCashierModel.name)
  }

  async verifyCashierBySucursalAndPin(sucursalCode: string, pin: string) {
    // Find sucursal by code (case-insensitive) to resolve the organization
    const [sucursal] = await db
      .select({
        id: sucursalModel.id,
        name: sucursalModel.name,
        organizationId: sucursalModel.organizationId,
      })
      .from(sucursalModel)
      .where(
        and(
          sql`upper(${sucursalModel.code}) = upper(${sucursalCode})`,
          eq(sucursalModel.isActive, true)
        )
      )
      .limit(1)

    if (!sucursal) return null

    // Find active cashier in the organization with matching PIN
    const [cashier] = await db
      .select()
      .from(posCashierModel)
      .where(
        and(
          eq(posCashierModel.organizationId, sucursal.organizationId),
          eq(posCashierModel.pin, pin),
          eq(posCashierModel.isActive, true)
        )
      )
      .limit(1)

    if (!cashier) return null

    // Check lockout
    if (cashier.pinAttempts >= 5 && cashier.pinLockedAt) {
      const lockedAt = new Date(cashier.pinLockedAt).getTime()
      const thirtyMin = 30 * 60 * 1000
      if (Date.now() - lockedAt < thirtyMin) return null
      // Lockout expired — reset
      await db
        .update(posCashierModel)
        .set({ pinAttempts: 0, pinLockedAt: null, updatedAt: new Date() })
        .where(eq(posCashierModel.id, cashier.id))
    }

    // Reset attempts on successful login
    if (cashier.pinAttempts > 0) {
      await db
        .update(posCashierModel)
        .set({ pinAttempts: 0, pinLockedAt: null, updatedAt: new Date() })
        .where(eq(posCashierModel.id, cashier.id))
    }

    return { ...cashier, sucursalId: sucursal.id, sucursalName: sucursal.name }
  }

  async getNextTerminalInvoiceNumber(terminalId: string): Promise<{
    prefix: string
    number: number
    formatted: string
  }> {
    const [result] = await db
      .update(posTerminalModel)
      .set({
        nextInvoiceNumber: sql`${posTerminalModel.nextInvoiceNumber} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(posTerminalModel.id, terminalId))
      .returning()

    if (!result) {
      throw new Error('POS terminal not found')
    }

    const currentNumber = result.nextInvoiceNumber - 1
    return {
      prefix: result.invoicePrefix,
      number: currentNumber,
      formatted: `${result.invoicePrefix}-${String(currentNumber).padStart(6, '0')}`,
    }
  }

  async verifyCashierPin(cashierId: string, pin: string) {
    const [cashier] = await db
      .select()
      .from(posCashierModel)
      .where(
        and(
          eq(posCashierModel.id, cashierId),
          eq(posCashierModel.isActive, true)
        )
      )
      .limit(1)

    if (!cashier) return null

    // Check lockout (5 failed attempts within 30 min)
    if (cashier.pinAttempts >= 5 && cashier.pinLockedAt) {
      const lockedAt = new Date(cashier.pinLockedAt).getTime()
      const thirtyMin = 30 * 60 * 1000
      if (Date.now() - lockedAt < thirtyMin) {
        return null
      }
      // Lockout expired — reset
      await db
        .update(posCashierModel)
        .set({ pinAttempts: 0, pinLockedAt: null, updatedAt: new Date() })
        .where(eq(posCashierModel.id, cashierId))
    }

    if (cashier.pin !== pin) {
      const newAttempts = cashier.pinAttempts + 1
      await db
        .update(posCashierModel)
        .set({
          pinAttempts: newAttempts,
          pinLockedAt: newAttempts >= 5 ? new Date() : null,
          updatedAt: new Date(),
        })
        .where(eq(posCashierModel.id, cashierId))
      return null
    }

    // Correct PIN — reset attempts
    if (cashier.pinAttempts > 0) {
      await db
        .update(posCashierModel)
        .set({ pinAttempts: 0, pinLockedAt: null, updatedAt: new Date() })
        .where(eq(posCashierModel.id, cashierId))
    }

    return cashier
  }
}

export const posRepository = new PosRepository()
