import { parseFile } from '../../lib/file-parser'
import { ACCOUNT_MESSAGES } from '../../messages'
import { accountsRepository } from '../repository'

export async function bulkUploadAccounts(
  organizationId: string,
  formData: FormData
) {
  const file = formData.get('file') as File | null

  if (!file) {
    return {
      success: false,
      message: 'No file provided',
    }
  }

  // Parse the file
  const parseResult = await parseFile(file)

  // Check for parsing errors
  if (parseResult.errors.length > 0 && parseResult.data.length === 0) {
    return {
      success: false,
      message: ACCOUNT_MESSAGES.invalidFile,
      errors: parseResult.errors,
    }
  }

  // Check if there are any valid rows
  if (parseResult.data.length === 0) {
    return {
      success: false,
      message: ACCOUNT_MESSAGES.noValidRows,
    }
  }

  // Perform bulk upsert
  try {
    const result = await accountsRepository.upsertMany(
      organizationId,
      parseResult.data
    )

    return {
      success: true,
      message: ACCOUNT_MESSAGES.bulkUploadSuccess(result.inserted, result.updated),
      data: result,
      parseErrors: parseResult.errors,
    }
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error ? error.message : ACCOUNT_MESSAGES.bulkUploadError,
    }
  }
}
