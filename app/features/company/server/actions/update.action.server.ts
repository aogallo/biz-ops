import z from 'zod'
import { requireAuth } from '~/server/auth/session.server'
import { updateCompanySchema } from '../../schema'
import { companyRepository } from '../repository/company.repository'

export async function updateCompany(request: Request, companyId: string) {
  const session = await requireAuth(request)

  const organizationId = session.session.activeOrganizationId
  if (!organizationId) {
    return { success: false, message: 'No active organization' }
  }

  const formData = await request.formData()
  const inputValues = Object.fromEntries(formData)

  const { success, error, data } = updateCompanySchema.safeParse(inputValues)

  if (!success) {
    return {
      success: false,
      message: 'Validation failed',
      errors: z.flattenError(error).fieldErrors,
    }
  }

  // Verify company belongs to org
  const existing = await companyRepository.getById(organizationId, companyId)
  if (!existing) {
    return { success: false, message: 'Company not found' }
  }

  // Check name uniqueness (excluding self)
  if (data.name !== existing.name) {
    const nameConflict = await companyRepository.getByName({
      organizationId,
      name: data.name,
    })
    if (nameConflict) {
      return {
        success: false,
        message: `Company with name "${data.name}" already exists in your organization`,
      }
    }
  }

  // Check code uniqueness (excluding self)
  if (data.code !== existing.code) {
    const codeConflict = await companyRepository.getByCode({
      organizationId,
      code: data.code,
    })
    if (codeConflict) {
      return {
        success: false,
        message: `Company code "${data.code}" is already taken`,
        errors: { code: [`Code "${data.code}" is already in use`] },
      }
    }
  }

  try {
    const company = await companyRepository.updateById(companyId, data)
    return { success: true, data: company }
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : 'Failed to update company',
    }
  }
}
