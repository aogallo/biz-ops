import { unitOfMeasureRepository } from '../repository'
import type { CreateUomInput } from '../../schemas'

export async function createUomAction(input: CreateUomInput) {
  return await unitOfMeasureRepository.create(input)
}
