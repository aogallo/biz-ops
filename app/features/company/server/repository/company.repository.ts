import { eq } from 'drizzle-orm'
import { db } from '~/server/db'
import { companyModel } from '~/server/db/schemas/company'

export class CompanyRepository {
  async getByOrganization(organizationId: string) {
    return db
      .select()
      .from(companyModel)
      .where(eq(companyModel.organizationId, organizationId))
  }
}

export const companyRepository = new CompanyRepository()
