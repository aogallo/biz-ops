import { organizationConfigRepository } from '../repository'
import type { UpdateAccountingConfigInput } from '../../schemas'

export interface UpdateConfigResult {
  success: boolean
  error?: string
}

export async function updateAccountingConfigAction(
  organizationId: string,
  data: UpdateAccountingConfigInput
): Promise<UpdateConfigResult> {
  try {
    await organizationConfigRepository.upsert(organizationId, data)
    return { success: true }
  } catch (error) {
    console.error('Error updating accounting config:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update config',
    }
  }
}
