import { getLocaleFromRequest, translateServer } from '~/i18n/translate.server'
import { requireAuth } from '~/server/auth/session.server'
import { createAccountSchema } from '../../schemas'
import { accountsRepository } from '../repository'

export async function updateAccount(request: Request, accountId: string) {
  const session = await requireAuth(request)
  const locale = getLocaleFromRequest(request)

  const organizationId = session.session.activeOrganizationId
  if (!organizationId) {
    return {
      success: false,
      message: translateServer(locale, 'messages.accounts.noOrganization'),
    }
  }

  const existingAccount = await accountsRepository.getById(accountId)
  if (!existingAccount) {
    return {
      success: false,
      message: translateServer(locale, 'messages.accounts.notFound'),
    }
  }

  if (existingAccount.organizationId !== organizationId) {
    return {
      success: false,
      message: translateServer(locale, 'messages.common.noPermission'),
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

  const accountNumberExists = await accountsRepository.existsByAccountNumber(
    organizationId,
    result.data.accountNumber!,
    accountId
  )

  if (accountNumberExists) {
    return {
      success: false,
      message: translateServer(
        locale,
        'messages.accounts.duplicateAccountNumber'
      ),
    }
  }

  try {
    const account = await accountsRepository.update(accountId, result.data)
    if (!account) {
      return {
        success: false,
        message: translateServer(locale, 'messages.accounts.notFound'),
      }
    }
    return {
      success: true,
      data: account,
    }
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error ? error.message : 'Failed to update account',
    }
  }
}
