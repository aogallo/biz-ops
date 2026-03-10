import { and, count, eq, ilike, ne, sql, type SQL } from 'drizzle-orm'
import { db } from '~/server/db'
import { productModel } from '~/server/db/schemas/products'
import { productCategoryModel } from '~/server/db/schemas/productCategory'
import type { CreateProductInput } from '../schemas'

export interface ProductFilters {
  search?: string
  categoryId?: string
  stockStatus?: 'normal' | 'low' | 'out'
}

export interface PaginationOptions {
  page: number
  pageSize: number
}

export class ProductsRepository {
  async create(data: CreateProductInput) {
    const [product] = await db.insert(productModel).values(data).returning()
    return product
  }

  async getAllByOrganization(organizationId: string) {
    return await db
      .select({
        id: productModel.id,
        organizationId: productModel.organizationId,
        categoryId: productModel.categoryId,
        sku: productModel.sku,
        name: productModel.name,
        description: productModel.description,
        imageUrl: productModel.imageUrl,
        price: productModel.price,
        stock: productModel.stock,
        minStock: productModel.minStock,
        productType: productModel.productType,
        attributesJson: productModel.attributesJson,
        createdAt: productModel.createdAt,
        updatedAt: productModel.updatedAt,
        categoryName: productCategoryModel.name,
        categoryColor: productCategoryModel.color,
      })
      .from(productModel)
      .leftJoin(
        productCategoryModel,
        eq(productModel.categoryId, productCategoryModel.id)
      )
      .where(eq(productModel.organizationId, organizationId))
      .orderBy(productModel.createdAt)
  }

  async getFiltered(
    organizationId: string,
    filters: ProductFilters,
    pagination: PaginationOptions
  ) {
    const conditions: SQL[] = [eq(productModel.organizationId, organizationId)]

    if (filters.search) {
      conditions.push(
        sql`(${ilike(productModel.name, `%${filters.search}%`)} OR ${ilike(productModel.sku, `%${filters.search}%`)})`
      )
    }

    if (filters.categoryId) {
      conditions.push(eq(productModel.categoryId, filters.categoryId))
    }

    if (filters.stockStatus === 'out') {
      conditions.push(
        sql`${productModel.stock} IS NOT NULL AND ${productModel.stock} = 0`
      )
    } else if (filters.stockStatus === 'low') {
      conditions.push(
        sql`${productModel.stock} IS NOT NULL AND ${productModel.stock} > 0 AND ${productModel.minStock} > 0 AND ${productModel.stock} <= ${productModel.minStock}`
      )
    } else if (filters.stockStatus === 'normal') {
      conditions.push(
        sql`(${productModel.stock} IS NULL OR ${productModel.minStock} = 0 OR ${productModel.stock} > ${productModel.minStock})`
      )
    }

    const whereClause = and(...conditions)

    const [totalResult] = await db
      .select({ count: count() })
      .from(productModel)
      .where(whereClause)

    const total = totalResult?.count ?? 0
    const offset = (pagination.page - 1) * pagination.pageSize

    const products = await db
      .select({
        id: productModel.id,
        organizationId: productModel.organizationId,
        categoryId: productModel.categoryId,
        sku: productModel.sku,
        name: productModel.name,
        description: productModel.description,
        imageUrl: productModel.imageUrl,
        price: productModel.price,
        stock: productModel.stock,
        minStock: productModel.minStock,
        createdAt: productModel.createdAt,
        updatedAt: productModel.updatedAt,
        categoryName: productCategoryModel.name,
        categoryColor: productCategoryModel.color,
      })
      .from(productModel)
      .leftJoin(
        productCategoryModel,
        eq(productModel.categoryId, productCategoryModel.id)
      )
      .where(whereClause)
      .orderBy(productModel.name)
      .limit(pagination.pageSize)
      .offset(offset)

    return {
      products,
      total,
      page: pagination.page,
      pageSize: pagination.pageSize,
      totalPages: Math.ceil(total / pagination.pageSize),
    }
  }

  async getBySku(organizationId: string, sku: string) {
    const [product] = await db
      .select()
      .from(productModel)
      .where(
        and(
          eq(productModel.organizationId, organizationId),
          eq(productModel.sku, sku)
        )
      )
      .limit(1)

    return product || null
  }

  async getBySkuWithCategory(organizationId: string, sku: string) {
    const [product] = await db
      .select({
        id: productModel.id,
        organizationId: productModel.organizationId,
        categoryId: productModel.categoryId,
        sku: productModel.sku,
        name: productModel.name,
        description: productModel.description,
        imageUrl: productModel.imageUrl,
        price: productModel.price,
        stock: productModel.stock,
        minStock: productModel.minStock,
        productType: productModel.productType,
        attributesJson: productModel.attributesJson,
        createdAt: productModel.createdAt,
        updatedAt: productModel.updatedAt,
        categoryName: productCategoryModel.name,
        categoryColor: productCategoryModel.color,
      })
      .from(productModel)
      .leftJoin(
        productCategoryModel,
        eq(productModel.categoryId, productCategoryModel.id)
      )
      .where(
        and(
          eq(productModel.organizationId, organizationId),
          eq(productModel.sku, sku)
        )
      )
      .limit(1)

    return product || null
  }

  async getById(id: string) {
    const [product] = await db
      .select()
      .from(productModel)
      .where(eq(productModel.id, id))
      .limit(1)

    return product || null
  }

  async update(id: string, data: Partial<CreateProductInput>) {
    const [product] = await db
      .update(productModel)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(productModel.id, id))
      .returning()

    return product || null
  }

  async delete(id: string) {
    try {
      await db.delete(productModel).where(eq(productModel.id, id))
      return true
    } catch {
      return false
    }
  }

  async existsBySku(organizationId: string, sku: string, excludeId?: string) {
    const conditions = excludeId
      ? and(
          eq(productModel.organizationId, organizationId),
          eq(productModel.sku, sku),
          ne(productModel.id, excludeId)
        )
      : and(
          eq(productModel.organizationId, organizationId),
          eq(productModel.sku, sku)
        )

    const [product] = await db
      .select({ id: productModel.id })
      .from(productModel)
      .where(conditions)
      .limit(1)

    return !!product
  }

  async countLowStock(organizationId: string) {
    const [result] = await db
      .select({ count: count() })
      .from(productModel)
      .where(
        and(
          eq(productModel.organizationId, organizationId),
          sql`${productModel.stock} > 0 AND ${productModel.stock} <= ${productModel.minStock}`
        )
      )
    return result?.count ?? 0
  }

  async countOutOfStock(organizationId: string) {
    const [result] = await db
      .select({ count: count() })
      .from(productModel)
      .where(
        and(
          eq(productModel.organizationId, organizationId),
          sql`(${productModel.stock} = 0 OR ${productModel.stock} IS NULL)`
        )
      )
    return result?.count ?? 0
  }

  async getInventoryStats(organizationId: string) {
    const [stats] = await db
      .select({
        totalProducts: count(),
        totalStockValue:
          sql<number>`COALESCE(SUM(CAST(${productModel.price} AS NUMERIC) * COALESCE(${productModel.stock}, 0)), 0)`.as(
            'total_stock_value'
          ),
        lowStockCount:
          sql<number>`COUNT(*) FILTER (WHERE ${productModel.stock} > 0 AND ${productModel.stock} <= ${productModel.minStock})`.as(
            'low_stock_count'
          ),
        outOfStockCount:
          sql<number>`COUNT(*) FILTER (WHERE ${productModel.stock} = 0 OR ${productModel.stock} IS NULL)`.as(
            'out_of_stock_count'
          ),
      })
      .from(productModel)
      .where(eq(productModel.organizationId, organizationId))

    return {
      totalProducts: stats?.totalProducts ?? 0,
      totalStockValue: Number(stats?.totalStockValue ?? 0),
      lowStockCount: stats?.lowStockCount ?? 0,
      outOfStockCount: stats?.outOfStockCount ?? 0,
    }
  }

  async getLowStockProducts(organizationId: string, limit = 5) {
    return await db
      .select({
        id: productModel.id,
        sku: productModel.sku,
        name: productModel.name,
        stock: productModel.stock,
        minStock: productModel.minStock,
        price: productModel.price,
      })
      .from(productModel)
      .where(
        and(
          eq(productModel.organizationId, organizationId),
          sql`${productModel.stock} <= ${productModel.minStock} AND ${productModel.minStock} > 0`
        )
      )
      .orderBy(
        sql`${productModel.stock}::float / NULLIF(${productModel.minStock}, 0)`
      )
      .limit(limit)
  }
}

export const productsRepository = new ProductsRepository()
