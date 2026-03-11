import { relations } from 'drizzle-orm'
import {
  boolean,
  integer,
  numeric,
  pgTable,
  text,
  uuid,
} from 'drizzle-orm/pg-core'
import {
  createInsertSchema,
  createSelectSchema,
} from 'drizzle-zod'
import type { z } from 'zod'
import { timestamps } from './common'
import { productModel } from './products'

export const comboModel = pgTable('combo', {
  id: uuid('id').primaryKey().defaultRandom(),
  productId: uuid('product_id')
    .notNull()
    .unique()
    .references(() => productModel.id, { onDelete: 'cascade' }),
  ...timestamps,
})

export const comboGroupModel = pgTable('combo_group', {
  id: uuid('id').primaryKey().defaultRandom(),
  comboId: uuid('combo_id')
    .notNull()
    .references(() => comboModel.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  minSelect: integer('min_select').notNull().default(1),
  maxSelect: integer('max_select').notNull().default(1),
  isRequired: boolean('is_required').notNull().default(true),
  sortOrder: integer('sort_order').notNull().default(0),
  ...timestamps,
})

export const comboGroupItemModel = pgTable('combo_group_item', {
  id: uuid('id').primaryKey().defaultRandom(),
  groupId: uuid('group_id')
    .notNull()
    .references(() => comboGroupModel.id, { onDelete: 'cascade' }),
  productId: uuid('product_id')
    .notNull()
    .references(() => productModel.id),
  isDefault: boolean('is_default').notNull().default(false),
  priceAdjustment: numeric('price_adjustment', { precision: 12, scale: 2 })
    .notNull()
    .default('0'),
  sortOrder: integer('sort_order').notNull().default(0),
  ...timestamps,
})

export const comboRelations = relations(comboModel, ({ one, many }) => ({
  product: one(productModel, {
    fields: [comboModel.productId],
    references: [productModel.id],
  }),
  groups: many(comboGroupModel),
}))

export const comboGroupRelations = relations(
  comboGroupModel,
  ({ one, many }) => ({
    combo: one(comboModel, {
      fields: [comboGroupModel.comboId],
      references: [comboModel.id],
    }),
    items: many(comboGroupItemModel),
  })
)

export const comboGroupItemRelations = relations(
  comboGroupItemModel,
  ({ one }) => ({
    group: one(comboGroupModel, {
      fields: [comboGroupItemModel.groupId],
      references: [comboGroupModel.id],
    }),
    product: one(productModel, {
      fields: [comboGroupItemModel.productId],
      references: [productModel.id],
    }),
  })
)

export const selectComboSchema = createSelectSchema(comboModel)
export const insertComboSchema = createInsertSchema(comboModel)
export const selectComboGroupSchema = createSelectSchema(comboGroupModel)
export const insertComboGroupSchema = createInsertSchema(comboGroupModel)
export const selectComboGroupItemSchema = createSelectSchema(comboGroupItemModel)
export const insertComboGroupItemSchema = createInsertSchema(comboGroupItemModel)

export type Combo = z.infer<typeof selectComboSchema>
export type InsertCombo = z.infer<typeof insertComboSchema>
export type ComboGroup = z.infer<typeof selectComboGroupSchema>
export type InsertComboGroup = z.infer<typeof insertComboGroupSchema>
export type ComboGroupItem = z.infer<typeof selectComboGroupItemSchema>
export type InsertComboGroupItem = z.infer<typeof insertComboGroupItemSchema>
