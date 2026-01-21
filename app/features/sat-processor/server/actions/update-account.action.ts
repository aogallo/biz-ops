import { satFileRepository } from '../repository/sat-file.repository'
import type { SatFile } from '~/server/db/schemas/sat-file'

export interface UpdateAccountResult {
  success: boolean
  data?: SatFile
  error?: string
}

export async function updateAccountAction(
  satFileId: string,
  accountingAccountId: string | null,
  organizationId: string
): Promise<UpdateAccountResult> {
  // Verify the record belongs to the organization
  const existingRecord = await satFileRepository.getById(satFileId)

  if (!existingRecord) {
    return {
      success: false,
      error: 'SAT file record not found',
    }
  }

  if (existingRecord.organizationId !== organizationId) {
    return {
      success: false,
      error: 'Unauthorized to update this record',
    }
  }

  const updated = await satFileRepository.updateAccountingAccount(
    satFileId,
    accountingAccountId
  )

  if (!updated) {
    return {
      success: false,
      error: 'Failed to update accounting account',
    }
  }

  return {
    success: true,
    data: updated,
  }
}
