import { createInsertSchema, createSelectSchema } from 'drizzle-zod'
import { z } from 'zod'
import { unitOfMeasureModel } from '~/server/db/schemas/unitOfMeasure'

export const insertUomSchema = createInsertSchema(unitOfMeasureModel)
export const selectUomSchema = createSelectSchema(unitOfMeasureModel)

export const createUomSchema = insertUomSchema
  .omit({ id: true, createdAt: true, updatedAt: true })
  .extend({
    organizationId: z.string().uuid(),
    name: z.string().min(1, 'Name is required'),
    abbreviation: z.string().min(1, 'Abbreviation is required'),
    category: z.enum(['weight', 'volume', 'count', 'other']).default('count'),
  })

export const updateUomSchema = createUomSchema.partial()

export type CreateUomInput = z.infer<typeof createUomSchema>
export type UpdateUomInput = z.infer<typeof updateUomSchema>
export type UomItem = z.infer<typeof selectUomSchema>
