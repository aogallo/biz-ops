import { companyRepository } from './repository/company.repository'

export async function getCompanyById(organizationId: string, id: string) {
  return await companyRepository.getById(organizationId, id)
}
