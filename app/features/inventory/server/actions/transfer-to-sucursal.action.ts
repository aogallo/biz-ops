import { inventoryRepository } from '../repository/inventory.repository'
import type { TransferToSucursalInput } from '../../schemas'

export async function transferToSucursalAction(input: TransferToSucursalInput) {
  return await inventoryRepository.transferToSucursal(
    input.organizationId,
    input.sucursalId,
    input.productId,
    input.quantity,
    input.notes
  )
}
