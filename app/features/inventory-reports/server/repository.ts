import { and, count, desc, eq, gte, lte, sql } from 'drizzle-orm'
import { db } from '~/server/db'
import { productModel } from '~/server/db/schemas/products'
import { productCategoryModel } from '~/server/db/schemas/productCategory'
import { stockMovementModel } from '~/server/db/schemas/stockMovement'

export class InventoryReportsRepository {
  /**
   * Stock value grouped by category
   */
  async getStockValueByCategory(organizationId: string) {
    return await db
      .select({
        categoryName:
          sql<string>`COALESCE(${productCategoryModel.name}, 'Uncategorized')`.as(
            'category_name'
          ),
        categoryColor: productCategoryModel.color,
        totalValue:
          sql<number>`COALESCE(SUM(${productModel.stock} * ${productModel.price}), 0)`.as(
            'total_value'
          ),
        productCount: count(),
      })
      .from(productModel)
      .leftJoin(
        productCategoryModel,
        eq(productModel.categoryId, productCategoryModel.id)
      )
      .where(eq(productModel.organizationId, organizationId))
      .groupBy(productCategoryModel.name, productCategoryModel.color)
      .orderBy(desc(sql`total_value`))
  }

  /**
   * Movement trends: entries vs exits over time
   */
  async getMovementTrends(
    organizationId: string,
    dateFrom: string,
    dateTo: string
  ) {
    return await db
      .select({
        date: sql<string>`DATE(${stockMovementModel.movementDate})`.as('date'),
        entries:
          sql<number>`COUNT(*) FILTER (WHERE ${stockMovementModel.type} = 'entry')`.as(
            'entries'
          ),
        exits:
          sql<number>`COUNT(*) FILTER (WHERE ${stockMovementModel.type} = 'exit')`.as(
            'exits'
          ),
        adjustments:
          sql<number>`COUNT(*) FILTER (WHERE ${stockMovementModel.type} = 'adjustment')`.as(
            'adjustments'
          ),
      })
      .from(stockMovementModel)
      .where(
        and(
          eq(stockMovementModel.organizationId, organizationId),
          gte(stockMovementModel.movementDate, new Date(dateFrom)),
          lte(stockMovementModel.movementDate, new Date(dateTo))
        )
      )
      .groupBy(sql`DATE(${stockMovementModel.movementDate})`)
      .orderBy(sql`date`)
  }

  /**
   * Top products by movement count
   */
  async getTopMovedProducts(organizationId: string, limit = 10) {
    return await db
      .select({
        productName: productModel.name,
        productSku: productModel.sku,
        totalMovements: count(),
        totalEntries:
          sql<number>`COUNT(*) FILTER (WHERE ${stockMovementModel.type} = 'entry')`.as(
            'entries'
          ),
        totalExits:
          sql<number>`COUNT(*) FILTER (WHERE ${stockMovementModel.type} = 'exit')`.as(
            'exits'
          ),
      })
      .from(stockMovementModel)
      .innerJoin(
        productModel,
        eq(stockMovementModel.productId, productModel.id)
      )
      .where(eq(stockMovementModel.organizationId, organizationId))
      .groupBy(productModel.name, productModel.sku)
      .orderBy(desc(count()))
      .limit(limit)
  }
}

export const inventoryReportsRepository = new InventoryReportsRepository()
