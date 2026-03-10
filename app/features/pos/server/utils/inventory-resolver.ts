
export interface CheckoutLineForInventory {
  productId: string
  productName: string
  quantity: number
  productType: string
  lineType?: string
  trackInventory?: boolean
}

export interface ResolvedInventoryDecrement {
  productId: string
  quantity: number
  sucursalId: string | null
  organizationId: string
  referenceType: string
  referenceId: string
  unitOfMeasureId: string | null
}

interface InventoryResolverDeps {
  expandRecipeToIngredients: (
    productId: string,
    multiplier: number
  ) => Promise<
    Array<{
      ingredientProductId: string
      quantity: number
      unitOfMeasureId: string | null
      trackInventory: boolean
    }>
  >
  getProductType: (productId: string) => Promise<string | null>
}

/**
 * Resolves which inventory records to decrement for a given set of cart lines.
 *
 * Resolution rules:
 * - lineType === 'product' + trackInventory=true + productType !== 'combo' → direct decrement
 * - lineType === 'combo' → SKIP (combos never decrement inventory directly)
 * - lineType === 'combo_item':
 *   - productType === 'recipe' → expand recipe ingredients, decrement each trackInventory ingredient
 *   - else + trackInventory=true → direct decrement
 * - trackInventory=false → SKIP regardless
 */
export async function resolveInventoryDecrements(
  lines: CheckoutLineForInventory[],
  context: {
    sucursalId: string | null
    organizationId: string
    referenceType: string
    referenceId: string
  },
  deps: InventoryResolverDeps
): Promise<ResolvedInventoryDecrement[]> {
  const decrements: ResolvedInventoryDecrement[] = []

  for (const line of lines) {
    const lineType = line.lineType ?? 'product'
    const trackInventory = line.trackInventory ?? true

    // Combo header lines never decrement directly
    if (line.productType === 'combo' || lineType === 'combo') {
      continue
    }

    // Skip if inventory tracking is disabled
    if (!trackInventory) {
      continue
    }

    if (line.productType === 'recipe') {
      // Expand recipe into its ingredients
      const ingredients = await deps.expandRecipeToIngredients(
        line.productId,
        line.quantity
      )
      for (const ingredient of ingredients) {
        if (!ingredient.trackInventory) continue
        decrements.push({
          productId: ingredient.ingredientProductId,
          quantity: ingredient.quantity,
          sucursalId: context.sucursalId,
          organizationId: context.organizationId,
          referenceType: context.referenceType,
          referenceId: context.referenceId,
          unitOfMeasureId: ingredient.unitOfMeasureId,
        })
      }
    } else {
      // Direct inventory decrement
      decrements.push({
        productId: line.productId,
        quantity: line.quantity,
        sucursalId: context.sucursalId,
        organizationId: context.organizationId,
        referenceType: context.referenceType,
        referenceId: context.referenceId,
        unitOfMeasureId: null,
      })
    }
  }

  return decrements
}
