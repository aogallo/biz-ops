import { createInsertSchema, createSelectSchema } from 'drizzle-zod'
import { z } from 'zod'
import { recipeModel, recipeItemModel } from '~/server/db/schemas/recipe'

export const insertRecipeSchema = createInsertSchema(recipeModel)
export const selectRecipeSchema = createSelectSchema(recipeModel)
export const insertRecipeItemSchema = createInsertSchema(recipeItemModel)
export const selectRecipeItemSchema = createSelectSchema(recipeItemModel)

export const recipeItemInputSchema = z.object({
  ingredientProductId: z.string().uuid(),
  quantity: z.number().positive('Quantity must be positive'),
  unitOfMeasureId: z.string().uuid().optional().nullable(),
  notes: z.string().optional().nullable(),
})

export const upsertRecipeSchema = z.object({
  productId: z.string().uuid(),
  servings: z.number().int().positive().default(1),
  items: z.array(recipeItemInputSchema).min(1, 'At least one ingredient is required'),
})

export type RecipeItemInput = z.infer<typeof recipeItemInputSchema>
export type UpsertRecipeInput = z.infer<typeof upsertRecipeSchema>
