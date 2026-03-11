import { eq } from 'drizzle-orm'
import { db } from '~/server/db'
import { recipeModel, recipeItemModel } from '~/server/db/schemas/recipe'
import { productModel } from '~/server/db/schemas/products'
import { unitOfMeasureModel } from '~/server/db/schemas/unitOfMeasure'
import type { UpsertRecipeInput } from '../schemas'

export interface IngredientUsage {
  ingredientProductId: string
  quantity: number
  unitOfMeasureId: string | null
  trackInventory: boolean
}

export class RecipeRepository {
  async findByProductId(productId: string) {
    const [recipe] = await db
      .select()
      .from(recipeModel)
      .where(eq(recipeModel.productId, productId))
      .limit(1)

    if (!recipe) return null

    const items = await db
      .select({
        id: recipeItemModel.id,
        ingredientProductId: recipeItemModel.ingredientProductId,
        ingredientName: productModel.name,
        ingredientSku: productModel.sku,
        quantity: recipeItemModel.quantity,
        unitOfMeasureId: recipeItemModel.unitOfMeasureId,
        unitName: unitOfMeasureModel.name,
        unitAbbreviation: unitOfMeasureModel.abbreviation,
        notes: recipeItemModel.notes,
      })
      .from(recipeItemModel)
      .leftJoin(productModel, eq(recipeItemModel.ingredientProductId, productModel.id))
      .leftJoin(unitOfMeasureModel, eq(recipeItemModel.unitOfMeasureId, unitOfMeasureModel.id))
      .where(eq(recipeItemModel.recipeId, recipe.id))

    return { ...recipe, items }
  }

  async upsertRecipe(input: UpsertRecipeInput) {
    return await db.transaction(async (tx) => {
      // Find existing or insert
      const existing = await tx
        .select()
        .from(recipeModel)
        .where(eq(recipeModel.productId, input.productId))
        .limit(1)

      let recipeId: string

      if (existing[0]) {
        // Update
        const [updated] = await tx
          .update(recipeModel)
          .set({ servings: input.servings, updatedAt: new Date() })
          .where(eq(recipeModel.id, existing[0].id))
          .returning()
        recipeId = updated.id
        // Delete old items
        await tx.delete(recipeItemModel).where(eq(recipeItemModel.recipeId, recipeId))
      } else {
        // Insert new
        const [inserted] = await tx
          .insert(recipeModel)
          .values({ productId: input.productId, servings: input.servings })
          .returning()
        recipeId = inserted.id
      }

      // Insert new items
      if (input.items.length > 0) {
        await tx.insert(recipeItemModel).values(
          input.items.map((item) => ({
            recipeId,
            ingredientProductId: item.ingredientProductId,
            quantity: String(item.quantity),
            unitOfMeasureId: item.unitOfMeasureId ?? null,
            notes: item.notes ?? null,
          }))
        )
      }

      return this.findByProductId(input.productId)
    })
  }

  async expandRecipeToIngredients(
    productId: string,
    multiplier: number = 1,
    removedIngredientIds: string[] = []
  ): Promise<IngredientUsage[]> {
    const recipe = await this.findByProductId(productId)
    if (!recipe) return []

    const results: IngredientUsage[] = []

    for (const item of recipe.items) {
      // Skip removed ingredients
      if (removedIngredientIds.includes(item.ingredientProductId)) continue

      // Check if ingredient is itself a recipe (nested expansion)
      const [ingredient] = await db
        .select({
          id: productModel.id,
          productType: productModel.productType,
          trackInventory: productModel.trackInventory,
        })
        .from(productModel)
        .where(eq(productModel.id, item.ingredientProductId))
        .limit(1)

      if (!ingredient) continue

      const qty = Number(item.quantity) * multiplier

      if (ingredient.productType === 'recipe') {
        // Recursively expand nested recipe
        const nested = await this.expandRecipeToIngredients(ingredient.id, qty)
        results.push(...nested)
      } else {
        results.push({
          ingredientProductId: item.ingredientProductId,
          quantity: qty,
          unitOfMeasureId: item.unitOfMeasureId,
          trackInventory: ingredient.trackInventory ?? true,
        })
      }
    }

    return results
  }
}

export const recipeRepository = new RecipeRepository()
