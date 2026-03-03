import { inventoryRepository } from '../repository/inventory.repository'
import type { IngressSucursalStockInput } from '../../schemas'

/**
 * Direct stock ingress to a sucursal (e.g. receiving goods at branch level).
 * Does NOT deduct from org stock — use transferToSucursal for org→branch moves.
 */
export async function ingressSucursalStockAction(input: IngressSucursalStockInput) {
  await inventoryRepository.upsertSucursalStock(
    input.sucursalId,
    input.productId,
    input.quantity
  )

  await inventoryRepository.recordMovement({
    organizationId: input.organizationId,
    sucursalId: input.sucursalId,
    productId: input.productId,
    type: 'in',
    quantity: input.quantity,
    notes: input.notes,
  })
}
