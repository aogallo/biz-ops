import { requireAuth } from '~/server/auth/session.server'
import { accountsRepository } from '../repository'

export async function deleteAccount(request: Request, accountId: string) {
  // Authenticate user
  const session = await requireAuth(request)

  // Get active organization from session
  const organizationId = session.session.activeOrganizationId
  if (!organizationId) {
    return {
      success: false,
      message: 'No active organization selected',
    }
  }

  // Verify account exists and belongs to organization
  const existingAccount = await accountsRepository.getById(accountId)
  if (!existingAccount) {
    return {
      success: false,
      message: 'Account not found',
    }
  }

  if (existingAccount.organizationId !== organizationId) {
    return {
      success: false,
      message: "You don't have permission to delete this account",
    }
  }

  // Delete account
  try {
    const deleted = await accountsRepository.delete(accountId)
    if (!deleted) {
      return {
        success: false,
        message: 'Failed to delete account',
      }
    }
    return {
      success: true,
      message: 'Account deleted successfully',
    }
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error ? error.message : 'Failed to delete account',
    }
  }
}
