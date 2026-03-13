import { count, desc, eq } from 'drizzle-orm'
import { db } from '~/server/db'
import { memberModel, organizationModel } from '~/server/db/schemas/auth'
import { organizationModuleModel } from '~/server/db/schemas/modules'
import type { OrganizationCreate } from '../schemas'

export class OrganizationRepository {
  async create(data: OrganizationCreate) {
    const response = await db.insert(organizationModel).values(data).returning()
    return response[0]
  }

  async getAll() {
    return await db.select().from(organizationModel)
  }

  async getById(id: string) {
    const data = await db
      .select()
      .from(organizationModel)
      .where(eq(organizationModel.id, id))

    if (data.length === 0) return null

    return data[0]
  }

  async updateById(
    id: string,
    data: Partial<typeof organizationModel.$inferInsert>
  ) {
    const [org] = await db
      .update(organizationModel)
      .set(data)
      .where(eq(organizationModel.id, id))
      .returning()
    return org
  }

  async delete(id: string) {
    try {
      await db.delete(organizationModel).where(eq(organizationModel.id, id))
      return true
    } catch {
      return false
    }
  }

  async getBySlug(slug: string) {
    const data = await db
      .select()
      .from(organizationModel)
      .where(eq(organizationModel.slug, slug))

    if (data.length === 0) return null

    return data[0]
  }

  async getAllWithStats() {
    return await db
      .select({
        id: organizationModel.id,
        name: organizationModel.name,
        slug: organizationModel.slug,
        createdAt: organizationModel.createdAt,
        memberCount: count(memberModel.id),
        activeModuleCount: count(organizationModuleModel.moduleKey),
      })
      .from(organizationModel)
      .leftJoin(
        memberModel,
        eq(memberModel.organizationId, organizationModel.id)
      )
      .leftJoin(
        organizationModuleModel,
        eq(organizationModuleModel.organizationId, organizationModel.id)
      )
      .where(eq(organizationModel.isAdmin, false))
      .groupBy(organizationModel.id)
      .orderBy(desc(organizationModel.createdAt))
  }
}

export const organizationRepository = new OrganizationRepository()
