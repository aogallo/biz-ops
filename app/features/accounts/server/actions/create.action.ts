import { requireAuth } from '~/server/auth/session.server'
import { createAccountSchema } from '../../schemas'
import { accountsRepository } from '../repository'

export async function createAccount(request: Request) {
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

  // Check account number uniqueness within organization
  const existingAccount = await accountsRepository.getByAccountNumber(
    organizationId,
    result.data.accountNumber!
  )

  if (existingAccount) {
    return {
      success: false,
      message: `Account with number "${result.data.accountNumber}" already exists in your organization`,
    }
  }

  // Create account
  try {
    const account = await accountsRepository.create(result.data)
    return {
      success: true,
      data: account,
    }
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error ? error.message : 'Failed to create account',
    }
  }
}
