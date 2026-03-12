import { getLocaleFromRequest, translateServer } from '~/i18n/translate.server'
import { requireAuth } from '~/server/auth/session.server'
import { accountsRepository } from '../repository'

export async function deleteAccount(request: Request, accountId: string) {
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

  try {
    const deleted = await accountsRepository.delete(accountId)
    if (!deleted) {
      return {
        success: false,
        message: translateServer(locale, 'messages.accounts.notFound'),
      }
    }
    return {
      success: true,
      message: translateServer(locale, 'messages.accounts.deleted'),
    }
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error ? error.message : 'Failed to delete account',
    }
  }
}
