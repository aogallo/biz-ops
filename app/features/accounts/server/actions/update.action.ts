import { requireAuth } from '~/server/auth/session.server'
import { createAccountSchema } from '../../schemas'
import { accountsRepository } from '../repository'

export async function updateAccount(request: Request, accountId: string) {
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
      message: "You don't have permission to update this account",
    }
  }

  // Parse form data
  const formData = await request.formData()
  const inputValues = {
    accountNumber: formData.get('accountNumber'),
    name: formData.get('name'),
    organizationId,
  }

  // Validate input
  const result = createAccountSchema.safeParse(inputValues)
  if (!result.success) {
    return {
      success: false,
      message: 'Validation failed',
      errors: result.error.flatten().fieldErrors,
    }
  }

  // Check account number uniqueness within organization (excluding current account)
  const accountNumberExists = await accountsRepository.existsByAccountNumber(
    organizationId,
    result.data.accountNumber!,
    accountId
  )

  if (accountNumberExists) {
    return {
      success: false,
      message: `Account with number "${result.data.accountNumber}" already exists in your organization`,
    }
  }

  // Update account
  try {
    const account = await accountsRepository.update(accountId, result.data)
    if (!account) {
      return {
        success: false,
        message: 'Failed to update account',
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
