import z from 'zod'
import { requireAuth } from '~/server/auth/session.server'
import { createCompanySchema } from '../../schema'
import { companyRepository } from '../repository/company.repository'

export async function createCompany(request: Request) {
  const session = await requireAuth(request)
  const organizationId = session.session.activeOrganizationId
  if (!organizationId) {
    return {
      success: false,
      message: 'No active organization selected',
    }
  }
  const formData = await request.formData()
  const inputValues = Object.fromEntries(formData)

  // Validate input
  const { success, error, data } = createCompanySchema.safeParse({
    ...inputValues,
    organizationId,
  })

  if (!success) {
    return {
      success: false,
      message: 'Validation failed',
      errors: z.flattenError(error).fieldErrors,
    }
  }

  // Check Name uniqueness within organization
  const existingCompany = await companyRepository.getByName({
    organizationId,
    name: data.name,
  })

  if (existingCompany) {
    return {
      success: false,
      message: `Company with name "${data.name}" already exists in your organization`,
    }
  }

  try {
    const company = await companyRepository.create(data)
    return {
      success: true,
      data: company,
    }
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error ? error.message : 'Failed to create company',
    }
  }
}
