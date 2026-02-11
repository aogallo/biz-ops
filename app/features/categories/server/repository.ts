import { and, count, eq } from 'drizzle-orm'
import { db } from '~/server/db'
import { productCategoryModel } from '~/server/db/schemas/productCategory'
import { productModel } from '~/server/db/schemas/products'
import type { CreateCategoryInput } from '../schemas'

export class CategoriesRepository {
  async create(data: CreateCategoryInput) {
    const [category] = await db
      .insert(productCategoryModel)
      .values(data)
      .returning()
    return category
  }

  async getAllByOrganization(organizationId: string) {
    return await db
      .select()
      .from(productCategoryModel)
      .where(eq(productCategoryModel.organizationId, organizationId))
      .orderBy(productCategoryModel.name)
  }

  async getById(id: string) {
    const [category] = await db
      .select()
      .from(productCategoryModel)
      .where(eq(productCategoryModel.id, id))
      .limit(1)
    return category || null
  }

  async update(id: string, data: Partial<CreateCategoryInput>) {
    const [category] = await db
      .update(productCategoryModel)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(productCategoryModel.id, id))
      .returning()
    return category || null
  }

  async delete(id: string) {
    // Check if category has products
    const [result] = await db
      .select({ count: count() })
      .from(productModel)
      .where(eq(productModel.categoryId, id))

    if (result && result.count > 0) {
      return { success: false, reason: 'has_products' as const }
    }

    await db
      .delete(productCategoryModel)
      .where(eq(productCategoryModel.id, id))
    return { success: true, reason: null }
  }

  async existsByName(organizationId: string, name: string, excludeId?: string) {
    const conditions = excludeId
      ? and(
          eq(productCategoryModel.organizationId, organizationId),
          eq(productCategoryModel.name, name),
          // ne not needed here - unique index handles it at DB level
        )
      : and(
          eq(productCategoryModel.organizationId, organizationId),
          eq(productCategoryModel.name, name)
        )

    const [category] = await db
      .select({ id: productCategoryModel.id })
      .from(productCategoryModel)
      .where(conditions)
      .limit(1)

    if (!category) return false
    if (excludeId && category.id === excludeId) return false
    return true
  }
}

export const categoriesRepository = new CategoriesRepository()
