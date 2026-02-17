import { getLocaleFromRequest, translateServer } from '~/i18n/translate.server'
import { requireAuth } from '~/server/auth/session.server'
import { createAccountSchema } from '../../schemas'
import { accountsRepository } from '../repository'

export async function createAccount(request: Request) {
  const session = await requireAuth(request)
  const locale = getLocaleFromRequest(request)

  const organizationId = session.session.activeOrganizationId
  if (!organizationId) {
    return {
      success: false,
      message: translateServer(locale, 'messages.accounts.noOrganization'),
    }
  }

  const formData = await request.formData()
  const inputValues = {
    accountNumber: formData.get('accountNumber'),
    name: formData.get('name'),
    organizationId,
  }

  const result = createAccountSchema.safeParse(inputValues)
  if (!result.success) {
    return {
      success: false,
      message: 'Validation failed',
      errors: result.error.flatten().fieldErrors,
    }
  }

  const existingAccount = await accountsRepository.getByAccountNumber(
    organizationId,
    result.data.accountNumber!
  )

  if (existingAccount) {
    return {
      success: false,
      message: translateServer(locale, 'messages.accounts.duplicateAccountNumber'),
    }
  }

  try {
    const account = await accountsRepository.create(result.data)
    return {
      success: true,
      data: account,
    }
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to create account',
    }
  }
}
