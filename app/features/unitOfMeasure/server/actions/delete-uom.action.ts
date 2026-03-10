import { unitOfMeasureRepository } from '../repository'

export async function deleteUomAction(id: string) {
  const deleted = await unitOfMeasureRepository.delete(id)
  if (!deleted) throw new Error('Unit of measure not found')
  return { success: true }
}
