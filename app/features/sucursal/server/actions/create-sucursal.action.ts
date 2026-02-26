import { sucursalRepository } from '../repository/sucursal.repository'
import type { CreateSucursalInput } from '../../schemas'

export async function createSucursalAction(input: CreateSucursalInput) {
  const existing = await sucursalRepository.getByCode(input.organizationId, input.code)
  if (existing) {
    throw new Error(`A sucursal with code "${input.code}" already exists`)
  }
  return await sucursalRepository.create(input)
}
