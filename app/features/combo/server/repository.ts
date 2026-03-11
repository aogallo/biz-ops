import { eq } from 'drizzle-orm'
import { db } from '~/server/db'
import { comboModel, comboGroupModel, comboGroupItemModel } from '~/server/db/schemas/combo'
import { productModel } from '~/server/db/schemas/products'
import type { UpsertComboInput, PosComboDefinition } from '../schemas'

export type { PosComboDefinition }

export class ComboRepository {
  async findByProductId(productId: string) {
    const [combo] = await db
      .select()
      .from(comboModel)
      .where(eq(comboModel.productId, productId))
      .limit(1)

    if (!combo) return null

    const groups = await db
      .select()
      .from(comboGroupModel)
      .where(eq(comboGroupModel.comboId, combo.id))
      .orderBy(comboGroupModel.sortOrder)

    const groupsWithItems = await Promise.all(
      groups.map(async (group) => {
        const items = await db
          .select()
          .from(comboGroupItemModel)
          .where(eq(comboGroupItemModel.groupId, group.id))
          .orderBy(comboGroupItemModel.sortOrder)
        return { ...group, items }
      })
    )

    return { ...combo, groups: groupsWithItems }
  }

  async getComboForPos(productId: string): Promise<PosComboDefinition | null> {
    const [combo] = await db
      .select()
      .from(comboModel)
      .where(eq(comboModel.productId, productId))
      .limit(1)

    if (!combo) return null

    const groups = await db
      .select()
      .from(comboGroupModel)
      .where(eq(comboGroupModel.comboId, combo.id))
      .orderBy(comboGroupModel.sortOrder)

    const groupsWithItems = await Promise.all(
      groups.map(async (group) => {
        const itemRows = await db
          .select({
            id: comboGroupItemModel.id,
            productId: comboGroupItemModel.productId,
            productName: productModel.name,
            productSku: productModel.sku,
            isDefault: comboGroupItemModel.isDefault,
            priceAdjustment: comboGroupItemModel.priceAdjustment,
            sortOrder: comboGroupItemModel.sortOrder,
          })
          .from(comboGroupItemModel)
          .leftJoin(productModel, eq(comboGroupItemModel.productId, productModel.id))
          .where(eq(comboGroupItemModel.groupId, group.id))
          .orderBy(comboGroupItemModel.sortOrder)

        return {
          id: group.id,
          name: group.name,
          minSelect: group.minSelect,
          maxSelect: group.maxSelect,
          isRequired: group.isRequired,
          sortOrder: group.sortOrder,
          items: itemRows.map((i) => ({
            id: i.id,
            productId: i.productId,
            productName: i.productName ?? '',
            productSku: i.productSku ?? '',
            isDefault: i.isDefault,
            priceAdjustment: Number(i.priceAdjustment),
            sortOrder: i.sortOrder,
          })),
        }
      })
    )

    return {
      comboId: combo.id,
      productId: combo.productId,
      groups: groupsWithItems,
    }
  }

  async upsertCombo(input: UpsertComboInput) {
    return await db.transaction(async (tx) => {
      // Find or create combo
      const existing = await tx
        .select()
        .from(comboModel)
        .where(eq(comboModel.productId, input.productId))
        .limit(1)

      let comboId: string

      if (existing[0]) {
        comboId = existing[0].id
        // Delete existing groups (cascade deletes items)
        await tx.delete(comboGroupModel).where(eq(comboGroupModel.comboId, comboId))
      } else {
        const [inserted] = await tx
          .insert(comboModel)
          .values({ productId: input.productId })
          .returning()
        comboId = inserted.id
      }

      // Insert new groups and items
      for (const group of input.groups) {
        const [insertedGroup] = await tx
          .insert(comboGroupModel)
          .values({
            comboId,
            name: group.name,
            minSelect: group.minSelect,
            maxSelect: group.maxSelect,
            isRequired: group.isRequired,
            sortOrder: group.sortOrder,
          })
          .returning()

        if (group.items.length > 0) {
          await tx.insert(comboGroupItemModel).values(
            group.items.map((item) => ({
              groupId: insertedGroup.id,
              productId: item.productId,
              isDefault: item.isDefault,
              priceAdjustment: String(item.priceAdjustment),
              sortOrder: item.sortOrder,
            }))
          )
        }
      }

      return this.findByProductId(input.productId)
    })
  }
}

export const comboRepository = new ComboRepository()
