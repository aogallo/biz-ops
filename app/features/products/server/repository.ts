import { and, eq, ne } from "drizzle-orm";
import { db } from "~/server/db";
import { productModel } from "~/server/db/schemas/products";
import type { CreateProductInput } from "../schemas";

export class ProductsRepository {
  /**
   * Create a new product
   */
  async create(data: CreateProductInput) {
    const [product] = await db.insert(productModel).values(data).returning();
    return product;
  }

  /**
   * Get all products for an organization
   */
  async getAllByOrganization(organizationId: string) {
    return await db
      .select()
      .from(productModel)
      .where(eq(productModel.organizationId, organizationId))
      .orderBy(productModel.createdAt);
  }

  /**
   * Get product by SKU within organization (business key lookup)
   */
  async getBySku(organizationId: string, sku: string) {
    const [product] = await db
      .select()
      .from(productModel)
      .where(
        and(
          eq(productModel.organizationId, organizationId),
          eq(productModel.sku, sku),
        ),
      )
      .limit(1);

    return product || null;
  }

  /**
   * Get product by ID (for internal operations)
   */
  async getById(id: string) {
    const [product] = await db
      .select()
      .from(productModel)
      .where(eq(productModel.id, id))
      .limit(1);

    return product || null;
  }

  /**
   * Update product
   */
  async update(id: string, data: Partial<CreateProductInput>) {
    const [product] = await db
      .update(productModel)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(productModel.id, id))
      .returning();

    return product || null;
  }

  /**
   * Delete product
   */
  async delete(id: string) {
    try {
      await db.delete(productModel).where(eq(productModel.id, id));
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Check if SKU exists in organization (for uniqueness validation)
   */
  async existsBySku(organizationId: string, sku: string, excludeId?: string) {
    const conditions = excludeId
      ? and(
          eq(productModel.organizationId, organizationId),
          eq(productModel.sku, sku),
          ne(productModel.id, excludeId), // For update operations
        )
      : and(
          eq(productModel.organizationId, organizationId),
          eq(productModel.sku, sku),
        );

    const [product] = await db
      .select({ id: productModel.id })
      .from(productModel)
      .where(conditions)
      .limit(1);

    return !!product;
  }
}

export const productsRepository = new ProductsRepository();
