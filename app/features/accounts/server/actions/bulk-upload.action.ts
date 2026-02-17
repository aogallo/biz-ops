import { getLocaleFromRequest, translateServer } from '~/i18n/translate.server'
import { parseFile } from '../../lib/file-parser'
import { accountsRepository } from '../repository'

export async function bulkUploadAccounts(
  request: Request,
  organizationId: string,
  formData: FormData
) {
  const locale = getLocaleFromRequest(request)
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
      message: translateServer(locale, 'messages.accounts.invalidFile'),
      errors: parseResult.errors,
    }
  }

  // Check if there are any valid rows
  if (parseResult.data.length === 0) {
    return {
      success: false,
      message: translateServer(locale, 'messages.accounts.noValidRows'),
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
      message: translateServer(locale, 'messages.accounts.bulkUploadSuccess', {
        inserted: String(result.inserted),
        updated: String(result.updated),
      }),
      data: result,
      parseErrors: parseResult.errors,
    }
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error ? error.message : translateServer(locale, 'messages.accounts.bulkUploadError'),
    }
  }
}
