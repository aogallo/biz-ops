import { and, eq, sql } from 'drizzle-orm'
import { db } from '~/server/db'
import { sucursalModel } from '~/server/db/schemas/sucursal'
import { companyModel } from '~/server/db/schemas/company'
import type { CreateSucursalInput, UpdateSucursalInput } from '../../schemas'

export class SucursalRepository {
  async getByOrganization(organizationId: string) {
    return await db
      .select({
        id: sucursalModel.id,
        name: sucursalModel.name,
        code: sucursalModel.code,
        address: sucursalModel.address,
        phone: sucursalModel.phone,
        isActive: sucursalModel.isActive,
        companyId: sucursalModel.companyId,
        companyName: companyModel.name,
        createdAt: sucursalModel.createdAt,
      })
      .from(sucursalModel)
      .leftJoin(companyModel, eq(sucursalModel.companyId, companyModel.id))
      .where(eq(sucursalModel.organizationId, organizationId))
      .orderBy(sucursalModel.name)
  }

  async getById(organizationId: string, id: string) {
    const [sucursal] = await db
      .select({
        id: sucursalModel.id,
        organizationId: sucursalModel.organizationId,
        companyId: sucursalModel.companyId,
        name: sucursalModel.name,
        code: sucursalModel.code,
        address: sucursalModel.address,
        phone: sucursalModel.phone,
        isActive: sucursalModel.isActive,
        companyName: companyModel.name,
        createdAt: sucursalModel.createdAt,
        updatedAt: sucursalModel.updatedAt,
      })
      .from(sucursalModel)
      .leftJoin(companyModel, eq(sucursalModel.companyId, companyModel.id))
      .where(
        and(
          eq(sucursalModel.organizationId, organizationId),
          eq(sucursalModel.id, id)
        )
      )
      .limit(1)
    return sucursal ?? null
  }

  async getByCode(organizationId: string, code: string) {
    const [sucursal] = await db
      .select()
      .from(sucursalModel)
      .where(
        and(
          eq(sucursalModel.organizationId, organizationId),
          sql`upper(${sucursalModel.code}) = upper(${code})`,
          eq(sucursalModel.isActive, true)
        )
      )
      .limit(1)
    return sucursal ?? null
  }

  async create(data: CreateSucursalInput) {
    const [sucursal] = await db
      .insert(sucursalModel)
      .values({ ...data, code: data.code.toUpperCase() })
      .returning()
    return sucursal
  }

  async updateById(id: string, data: UpdateSucursalInput) {
    const [sucursal] = await db
      .update(sucursalModel)
      .set({
        ...data,
        code: data.code ? data.code.toUpperCase() : undefined,
        updatedAt: new Date(),
      })
      .where(eq(sucursalModel.id, id))
      .returning()
    return sucursal ?? null
  }
}

export const sucursalRepository = new SucursalRepository()
