import { and, count, desc, eq, gte, lte } from 'drizzle-orm'
import { db } from '~/server/db'
import { userModel } from '~/server/db/schemas/auth'
import { productModel } from '~/server/db/schemas/products'
import { stockMovementModel } from '~/server/db/schemas/stockMovement'
import type { CreateStockMovementInput } from '../schemas'

export interface StockMovementFilters {
  productId?: string
  type?: 'entry' | 'exit' | 'adjustment'
  dateFrom?: string
  dateTo?: string
}

export class StockMovementRepository {
  /**
   * Create a stock movement and update product stock in a transaction.
   * For 'exit' movements, validates sufficient stock.
   */
  async create(data: CreateStockMovementInput) {
    return await db.transaction(async (tx) => {
      // Get current product stock
      const [product] = await tx
        .select({ id: productModel.id, stock: productModel.stock })
        .from(productModel)
        .where(eq(productModel.id, data.productId))
        .limit(1)

      if (!product) {
        throw new Error('Product not found')
      }

      const currentStock = product.stock ?? 0
      let newStock: number

      if (data.type === 'entry') {
        newStock = currentStock + data.quantity
      } else if (data.type === 'exit') {
        newStock = currentStock - data.quantity
        if (newStock < 0) {
          throw new Error(
            `Insufficient stock. Current: ${currentStock}, Requested: ${data.quantity}`
          )
        }
      } else {
        // adjustment: quantity is the new absolute stock level
        newStock = data.quantity
      }

      // Insert stock movement
      const [movement] = await tx
        .insert(stockMovementModel)
        .values(data)
        .returning()

      // Update product stock
      await tx
        .update(productModel)
        .set({ stock: newStock, updatedAt: new Date() })
        .where(eq(productModel.id, data.productId))

      return movement
    })
  }

  async getByOrganization(
    organizationId: string,
    filters: StockMovementFilters,
    page = 1,
    pageSize = 10
  ) {
    const conditions = [eq(stockMovementModel.organizationId, organizationId)]

    if (filters.productId) {
      conditions.push(eq(stockMovementModel.productId, filters.productId))
    }
    if (filters.type) {
      conditions.push(eq(stockMovementModel.type, filters.type))
    }
    if (filters.dateFrom) {
      conditions.push(
        gte(stockMovementModel.movementDate, new Date(filters.dateFrom))
      )
    }
    if (filters.dateTo) {
      conditions.push(
        lte(stockMovementModel.movementDate, new Date(filters.dateTo))
      )
    }

    const whereClause = and(...conditions)

    const [totalResult] = await db
      .select({ count: count() })
      .from(stockMovementModel)
      .where(whereClause)

    const total = totalResult?.count ?? 0
    const offset = (page - 1) * pageSize

    const movements = await db
      .select({
        id: stockMovementModel.id,
        type: stockMovementModel.type,
        quantity: stockMovementModel.quantity,
        reason: stockMovementModel.reason,
        referenceType: stockMovementModel.referenceType,
        referenceId: stockMovementModel.referenceId,
        notes: stockMovementModel.notes,
        movementDate: stockMovementModel.movementDate,
        createdAt: stockMovementModel.createdAt,
        productName: productModel.name,
        productSku: productModel.sku,
        createdByName: userModel.name,
      })
      .from(stockMovementModel)
      .innerJoin(
        productModel,
        eq(stockMovementModel.productId, productModel.id)
      )
      .leftJoin(userModel, eq(stockMovementModel.createdById, userModel.id))
      .where(whereClause)
      .orderBy(desc(stockMovementModel.movementDate))
      .limit(pageSize)
      .offset(offset)

    return {
      movements,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    }
  }

  async getByProduct(productId: string, limit = 10) {
    return await db
      .select({
        id: stockMovementModel.id,
        type: stockMovementModel.type,
        quantity: stockMovementModel.quantity,
        reason: stockMovementModel.reason,
        referenceType: stockMovementModel.referenceType,
        notes: stockMovementModel.notes,
        movementDate: stockMovementModel.movementDate,
        createdByName: userModel.name,
      })
      .from(stockMovementModel)
      .leftJoin(userModel, eq(stockMovementModel.createdById, userModel.id))
      .where(eq(stockMovementModel.productId, productId))
      .orderBy(desc(stockMovementModel.movementDate))
      .limit(limit)
  }

  async getRecentByOrganization(organizationId: string, limit = 5) {
    return await db
      .select({
        id: stockMovementModel.id,
        type: stockMovementModel.type,
        quantity: stockMovementModel.quantity,
        reason: stockMovementModel.reason,
        movementDate: stockMovementModel.movementDate,
        productName: productModel.name,
        productSku: productModel.sku,
      })
      .from(stockMovementModel)
      .innerJoin(
        productModel,
        eq(stockMovementModel.productId, productModel.id)
      )
      .where(eq(stockMovementModel.organizationId, organizationId))
      .orderBy(desc(stockMovementModel.movementDate))
      .limit(limit)
  }
}

export const stockMovementRepository = new StockMovementRepository()
