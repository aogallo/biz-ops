import { requireAuth } from '~/server/auth/session.server'
import { companyRepository } from './repository/company.repository'

export async function listCompanies(request: Request) {
  const session = await requireAuth(request)

  const organizationId = session.session.activeOrganizationId
  if (!organizationId) {
    return {
      success: false,
      message: 'No active organization selected',
    }
  }

  const companies = companyRepository.getByOrganization(organizationId)

  return {
    success: true,
    data: companies,
  }
}
