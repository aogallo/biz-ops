import { unitOfMeasureRepository } from '../repository'
import type { UpdateUomInput } from '../../schemas'

export async function updateUomAction(id: string, input: UpdateUomInput) {
  const uom = await unitOfMeasureRepository.update(id, input)
  if (!uom) throw new Error('Unit of measure not found')
  return uom
}
