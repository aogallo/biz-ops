import { eq } from 'drizzle-orm'
import { db } from '~/server/db'
import { unitOfMeasureModel } from '~/server/db/schemas/unitOfMeasure'
import type { CreateUomInput, UpdateUomInput } from '../schemas'

export class UnitOfMeasureRepository {
  async findByOrganization(organizationId: string) {
    return await db
      .select()
      .from(unitOfMeasureModel)
      .where(eq(unitOfMeasureModel.organizationId, organizationId))
      .orderBy(unitOfMeasureModel.name)
  }

  async findById(id: string) {
    const [uom] = await db
      .select()
      .from(unitOfMeasureModel)
      .where(eq(unitOfMeasureModel.id, id))
      .limit(1)
    return uom ?? null
  }

  async create(data: CreateUomInput) {
    const [uom] = await db.insert(unitOfMeasureModel).values(data).returning()
    return uom
  }

  async update(id: string, data: UpdateUomInput) {
    const [uom] = await db
      .update(unitOfMeasureModel)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(unitOfMeasureModel.id, id))
      .returning()
    return uom ?? null
  }

  async delete(id: string) {
    const result = await db
      .delete(unitOfMeasureModel)
      .where(eq(unitOfMeasureModel.id, id))
      .returning()
    return result.length > 0
  }
}

export const unitOfMeasureRepository = new UnitOfMeasureRepository()
