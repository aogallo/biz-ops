import { and, count, desc, eq, ilike, or, sql, type SQL } from 'drizzle-orm'
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
import { companyModel } from '~/server/db/schemas/company'
import { businessPartnerModel } from '~/server/db/schemas/businessPartner'
import { organizationModel, userModel } from '~/server/db/schemas/auth'
import type {
  CreateTerminalInput,
  UpdateTerminalInput,
  CreateCashierInput,
  UpdateCashierInput,
} from '../schemas'
import type { PosProductForGrid, PosTerminalWithCompany } from '../types'

export class PosRepository {
  // ── Terminal CRUD ──

  async getTerminals(organizationId: string): Promise<PosTerminalWithCompany[]> {
    const terminals = await db
      .select({
        id: posTerminalModel.id,
        name: posTerminalModel.name,
        isActive: posTerminalModel.isActive,
        autoGenerateInvoice: posTerminalModel.autoGenerateInvoice,
        companyId: posTerminalModel.companyId,
        companyName: companyModel.name,
        defaultBusinessPartnerId: posTerminalModel.defaultBusinessPartnerId,
      })
      .from(posTerminalModel)
      .innerJoin(companyModel, eq(posTerminalModel.companyId, companyModel.id))
      .where(eq(posTerminalModel.organizationId, organizationId))
      .orderBy(posTerminalModel.name)

    return terminals
  }

  async getTerminalById(id: string) {
    const [terminal] = await db
      .select({
        id: posTerminalModel.id,
        organizationId: posTerminalModel.organizationId,
        companyId: posTerminalModel.companyId,
        name: posTerminalModel.name,
        isActive: posTerminalModel.isActive,
        autoGenerateInvoice: posTerminalModel.autoGenerateInvoice,
        defaultBusinessPartnerId: posTerminalModel.defaultBusinessPartnerId,
        companyName: companyModel.name,
        companyNit: companyModel.nit,
      })
      .from(posTerminalModel)
      .innerJoin(companyModel, eq(posTerminalModel.companyId, companyModel.id))
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
    categoryId?: string,
    search?: string
  ): Promise<PosProductForGrid[]> {
    const conditions: SQL[] = [
      eq(productModel.organizationId, organizationId),
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
        productType: productModel.productType,
        categoryId: productModel.categoryId,
        categoryName: productCategoryModel.name,
        categoryColor: productCategoryModel.color,
      })
      .from(productModel)
      .leftJoin(
        productCategoryModel,
        eq(productModel.categoryId, productCategoryModel.id)
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
        db
          .select()
          .from(posPaymentModel)
          .where(eq(posPaymentModel.saleId, id)),
        db
          .select({ id: businessPartnerModel.id, name: businessPartnerModel.name, nit: businessPartnerModel.nit })
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
          .select({ id: posTerminalModel.id, name: posTerminalModel.name })
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
      status?: string
      search?: string
      limit?: number
      offset?: number
    } = {}
  ) {
    const { terminalId, status, search, limit = 10, offset = 0 } = filters
    const conditions: SQL[] = [eq(posSaleModel.organizationId, organizationId)]

    if (terminalId) {
      conditions.push(eq(posSaleModel.terminalId, terminalId))
    }
    if (status) {
      conditions.push(
        eq(posSaleModel.status, status as 'completed' | 'voided' | 'refunded')
      )
    }
    if (search) {
      conditions.push(ilike(posSaleModel.saleNumber, `%${search}%`))
    }

    const whereClause = and(...conditions)

    const [totalResult] = await db
      .select({ count: count() })
      .from(posSaleModel)
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
      })
      .from(posSaleModel)
      .innerJoin(posCashierModel, eq(posSaleModel.cashierId, posCashierModel.id))
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

    return { sales, total }
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
        companyId: posCashierModel.companyId,
        companyName: companyModel.name,
      })
      .from(posCashierModel)
      .leftJoin(userModel, eq(posCashierModel.userId, userModel.id))
      .innerJoin(companyModel, eq(posCashierModel.companyId, companyModel.id))
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
    const [cashier] = await db
      .insert(posCashierModel)
      .values(data)
      .returning()
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

  async getSessionById(id: string) {
    const [session] = await db
      .select()
      .from(posSessionModel)
      .where(eq(posSessionModel.id, id))
      .limit(1)
    return session ?? null
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

  async getActiveOrganizations() {
    return await db
      .select({
        id: organizationModel.id,
        name: organizationModel.name,
        slug: organizationModel.slug,
      })
      .from(organizationModel)
      .orderBy(organizationModel.name)
  }

  async getActiveCashiersForOrganization(organizationId: string) {
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

  async verifyCashierPin(cashierId: string, pin: string) {
    const [cashier] = await db
      .select()
      .from(posCashierModel)
      .where(and(eq(posCashierModel.id, cashierId), eq(posCashierModel.isActive, true)))
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
