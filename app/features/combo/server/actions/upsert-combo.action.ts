import { comboRepository } from '../repository'
import type { UpsertComboInput } from '../../schemas'

export async function upsertComboAction(input: UpsertComboInput) {
  return await comboRepository.upsertCombo(input)
}
