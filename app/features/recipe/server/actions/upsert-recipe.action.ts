import { recipeRepository } from '../repository'
import type { UpsertRecipeInput } from '../../schemas'

export async function upsertRecipeAction(input: UpsertRecipeInput) {
  return await recipeRepository.upsertRecipe(input)
}
