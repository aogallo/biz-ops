import { and, eq, sql } from 'drizzle-orm'
import { db } from '~/server/db'
import {
  sucursalInventoryModel,
  inventoryMovementModel,
} from '~/server/db/schemas/sucursal'
import { productModel } from '~/server/db/schemas/products'

export class InventoryRepository {
  async getSucursalInventory(sucursalId: string) {
    return await db
      .select({
        id: sucursalInventoryModel.id,
        sucursalId: sucursalInventoryModel.sucursalId,
        productId: sucursalInventoryModel.productId,
        stock: sucursalInventoryModel.stock,
        minStock: sucursalInventoryModel.minStock,
        productName: productModel.name,
        productSku: productModel.sku,
        productPrice: productModel.price,
        productType: productModel.productType,
        orgStock: productModel.stock,
      })
      .from(sucursalInventoryModel)
      .innerJoin(productModel, eq(sucursalInventoryModel.productId, productModel.id))
      .where(eq(sucursalInventoryModel.sucursalId, sucursalId))
      .orderBy(productModel.name)
  }

  async getStockForProduct(sucursalId: string, productId: string) {
    const [entry] = await db
      .select()
      .from(sucursalInventoryModel)
      .where(
        and(
          eq(sucursalInventoryModel.sucursalId, sucursalId),
          eq(sucursalInventoryModel.productId, productId)
        )
      )
      .limit(1)
    return entry ?? null
  }

  async upsertSucursalStock(sucursalId: string, productId: string, delta: number) {
    const [entry] = await db
      .insert(sucursalInventoryModel)
      .values({ sucursalId, productId, stock: delta })
      .onConflictDoUpdate({
        target: [sucursalInventoryModel.sucursalId, sucursalInventoryModel.productId],
        set: {
          stock: sql`${sucursalInventoryModel.stock} + ${delta}`,
          updatedAt: new Date(),
        },
      })
      .returning()
    return entry
  }

  async adjustSucursalStock(sucursalId: string, productId: string, newStock: number) {
    const [entry] = await db
      .insert(sucursalInventoryModel)
      .values({ sucursalId, productId, stock: newStock })
      .onConflictDoUpdate({
        target: [sucursalInventoryModel.sucursalId, sucursalInventoryModel.productId],
        set: {
          stock: newStock,
          updatedAt: new Date(),
        },
      })
      .returning()
    return entry
  }

  async transferToSucursal(
    organizationId: string,
    sucursalId: string,
    productId: string,
    quantity: number,
    notes?: string
  ) {
    return await db.transaction(async (tx) => {
      // Deduct from org main stock
      const [product] = await tx
        .update(productModel)
        .set({
          stock: sql`${productModel.stock} - ${quantity}`,
          updatedAt: new Date(),
        })
        .where(eq(productModel.id, productId))
        .returning()

      if (!product || (product.stock ?? 0) < 0) {
        throw new Error('Insufficient org stock for transfer')
      }

      // Add to sucursal inventory
      await tx
        .insert(sucursalInventoryModel)
        .values({ sucursalId, productId, stock: quantity })
        .onConflictDoUpdate({
          target: [
            sucursalInventoryModel.sucursalId,
            sucursalInventoryModel.productId,
          ],
          set: {
            stock: sql`${sucursalInventoryModel.stock} + ${quantity}`,
            updatedAt: new Date(),
          },
        })

      // Record outbound movement (from org)
      await tx.insert(inventoryMovementModel).values({
        organizationId,
        productId,
        sucursalId,
        type: 'transfer_to_sucursal',
        quantity: -quantity,
        notes,
      })

      // Record inbound movement (to sucursal)
      await tx.insert(inventoryMovementModel).values({
        organizationId,
        productId,
        sucursalId,
        type: 'transfer_to_sucursal',
        quantity,
        notes,
      })

      return { success: true }
    })
  }

  async recordMovement(data: {
    organizationId: string
    sucursalId?: string
    productId: string
    type: 'in' | 'out' | 'transfer_to_sucursal' | 'transfer_from_sucursal' | 'adjustment'
    quantity: number
    notes?: string
    createdBy?: string
  }) {
    const [movement] = await db
      .insert(inventoryMovementModel)
      .values(data)
      .returning()
    return movement
  }
}

export const inventoryRepository = new InventoryRepository()
