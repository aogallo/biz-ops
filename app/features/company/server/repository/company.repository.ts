import { and, eq, sql } from 'drizzle-orm'
import { db } from '~/server/db'
import { companyModel } from '~/server/db/schemas/company'
import type {
  Company,
  CreateCompanyInput,
  UpdateCompanyInput,
} from '../../schema'

export class CompanyRepository {
  async getByOrganization(organizationId: string) {
    return db
      .select()
      .from(companyModel)
      .where(eq(companyModel.organizationId, organizationId))
  }

  async getById(organizationId: string, id: string) {
    const [company] = await db
      .select()
      .from(companyModel)
      .where(
        and(
          eq(companyModel.organizationId, organizationId),
          eq(companyModel.id, id)
        )
      )
      .limit(1)
    return company || null
  }

  async updateById(
    id: string,
    data: UpdateCompanyInput
  ): Promise<Company | null> {
    const [company] = await db
      .update(companyModel)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(companyModel.id, id))
      .returning()
    return company || null
  }

  async create(data: CreateCompanyInput) {
    const [company] = await db.insert(companyModel).values(data).returning()
    return company
  }

  async getByCode({
    organizationId,
    code,
  }: {
    organizationId: string
    code: string
  }): Promise<Company | null> {
    const [company] = await db
      .select()
      .from(companyModel)
      .where(
        and(
          eq(companyModel.organizationId, organizationId),
          sql`upper(${companyModel.code}) = upper(${code})`
        )
      )
      .limit(1)
    return company || null
  }

  async getByName({
    organizationId,
    name,
  }: {
    organizationId: string
    name: string
  }): Promise<Company | null> {
    const [company] = await db
      .select()
      .from(companyModel)
      .where(
        and(
          eq(companyModel.organizationId, organizationId),
          eq(companyModel.name, name)
        )
      )
      .limit(1)
    return company || null
  }
}

export const companyRepository = new CompanyRepository()
