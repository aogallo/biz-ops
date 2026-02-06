import { and, eq } from 'drizzle-orm'
import { db } from '~/server/db'
import { serviceModel } from '~/server/db/schemas/service'
import type { CreateServiceInput, UpdateServiceInput } from '../schemas'

export class ServicesRepository {
  /**
   * Create a new service
   */
  async create(data: CreateServiceInput) {
    const [service] = await db.insert(serviceModel).values(data).returning()
    return service
  }

  /**
   * Get all services for an organization
   */
  async getAllByOrganization(organizationId: string) {
    return await db
      .select()
      .from(serviceModel)
      .where(eq(serviceModel.organizationId, organizationId))
      .orderBy(serviceModel.name)
  }

  /**
   * Get all active services for an organization
   */
  async getActiveByOrganization(organizationId: string) {
    return await db
      .select()
      .from(serviceModel)
      .where(
        and(
          eq(serviceModel.organizationId, organizationId),
          eq(serviceModel.isActive, true)
        )
      )
      .orderBy(serviceModel.name)
  }

  /**
   * Get service by ID
   */
  async getById(id: string) {
    const [service] = await db
      .select()
      .from(serviceModel)
      .where(eq(serviceModel.id, id))
      .limit(1)

    return service || null
  }

  /**
   * Get service by ID within an organization
   */
  async getByIdAndOrganization(id: string, organizationId: string) {
    const [service] = await db
      .select()
      .from(serviceModel)
      .where(
        and(
          eq(serviceModel.id, id),
          eq(serviceModel.organizationId, organizationId)
        )
      )
      .limit(1)

    return service || null
  }

  /**
   * Update service
   */
  async update(id: string, data: Partial<Omit<UpdateServiceInput, 'id'>>) {
    const [service] = await db
      .update(serviceModel)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(serviceModel.id, id))
      .returning()

    return service || null
  }

  /**
   * Delete service (soft delete by setting isActive to false)
   */
  async softDelete(id: string) {
    const [service] = await db
      .update(serviceModel)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(serviceModel.id, id))
      .returning()

    return service || null
  }

  /**
   * Hard delete service
   */
  async delete(id: string) {
    try {
      await db.delete(serviceModel).where(eq(serviceModel.id, id))
      return true
    } catch {
      return false
    }
  }

  /**
   * Check if service name exists in organization
   */
  async existsByName(organizationId: string, name: string, excludeId?: string) {
    const conditions = excludeId
      ? and(
          eq(serviceModel.organizationId, organizationId),
          eq(serviceModel.name, name),
          eq(serviceModel.id, excludeId)
        )
      : and(
          eq(serviceModel.organizationId, organizationId),
          eq(serviceModel.name, name)
        )

    const [service] = await db
      .select({ id: serviceModel.id })
      .from(serviceModel)
      .where(conditions)
      .limit(1)

    return !!service
  }
}

export const servicesRepository = new ServicesRepository()
