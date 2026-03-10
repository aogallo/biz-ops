import { relations } from 'drizzle-orm'
import {
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
import { unitOfMeasureModel } from './unitOfMeasure'

export const recipeModel = pgTable('recipe', {
  id: uuid('id').primaryKey().defaultRandom(),
  productId: uuid('product_id')
    .notNull()
    .unique()
    .references(() => productModel.id, { onDelete: 'cascade' }),
  servings: integer('servings').notNull().default(1),
  ...timestamps,
})

export const recipeItemModel = pgTable('recipe_item', {
  id: uuid('id').primaryKey().defaultRandom(),
  recipeId: uuid('recipe_id')
    .notNull()
    .references(() => recipeModel.id, { onDelete: 'cascade' }),
  ingredientProductId: uuid('ingredient_product_id')
    .notNull()
    .references(() => productModel.id),
  quantity: numeric('quantity', { precision: 12, scale: 4 }).notNull(),
  unitOfMeasureId: uuid('unit_of_measure_id').references(
    () => unitOfMeasureModel.id
  ),
  notes: text('notes'),
  ...timestamps,
})

export const recipeRelations = relations(recipeModel, ({ one, many }) => ({
  product: one(productModel, {
    fields: [recipeModel.productId],
    references: [productModel.id],
  }),
  items: many(recipeItemModel),
}))

export const recipeItemRelations = relations(recipeItemModel, ({ one }) => ({
  recipe: one(recipeModel, {
    fields: [recipeItemModel.recipeId],
    references: [recipeModel.id],
  }),
  ingredientProduct: one(productModel, {
    fields: [recipeItemModel.ingredientProductId],
    references: [productModel.id],
    relationName: 'ingredientProduct',
  }),
  unitOfMeasure: one(unitOfMeasureModel, {
    fields: [recipeItemModel.unitOfMeasureId],
    references: [unitOfMeasureModel.id],
  }),
}))

export const selectRecipeSchema = createSelectSchema(recipeModel)
export const insertRecipeSchema = createInsertSchema(recipeModel)
export const selectRecipeItemSchema = createSelectSchema(recipeItemModel)
export const insertRecipeItemSchema = createInsertSchema(recipeItemModel)

export type Recipe = z.infer<typeof selectRecipeSchema>
export type InsertRecipe = z.infer<typeof insertRecipeSchema>
export type RecipeItem = z.infer<typeof selectRecipeItemSchema>
export type InsertRecipeItem = z.infer<typeof insertRecipeItemSchema>
