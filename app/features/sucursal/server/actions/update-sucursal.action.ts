import { sucursalRepository } from '../repository/sucursal.repository'
import type { UpdateSucursalInput } from '../../schemas'

export async function updateSucursalAction(
  organizationId: string,
  id: string,
  input: UpdateSucursalInput
) {
  if (input.code) {
    const existing = await sucursalRepository.getByCode(organizationId, input.code)
    if (existing && existing.id !== id) {
      throw new Error(`A sucursal with code "${input.code}" already exists`)
    }
  }
  return await sucursalRepository.updateById(id, input)
}
