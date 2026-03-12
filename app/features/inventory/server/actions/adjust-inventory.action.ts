import { inventoryRepository } from '../repository/inventory.repository'
import type { AdjustSucursalStockInput } from '../../schemas'

export async function adjustSucursalStockAction(
  input: AdjustSucursalStockInput
) {
  const entry = await inventoryRepository.adjustSucursalStock(
    input.sucursalId,
    input.productId,
    input.newStock
  )

  await inventoryRepository.recordMovement({
    organizationId: input.organizationId,
    sucursalId: input.sucursalId,
    productId: input.productId,
    type: 'adjustment',
    quantity: input.newStock,
    notes: input.notes,
  })

  return entry
}
