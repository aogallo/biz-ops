import { createInsertSchema, createUpdateSchema } from 'drizzle-zod'
import { z } from 'zod'
import { sucursalModel } from '~/server/db/schemas/sucursal'

export const insertSucursalFormSchema = createInsertSchema(sucursalModel)

export const createSucursalSchema = insertSucursalFormSchema
  .omit({ id: true, createdAt: true, updatedAt: true })
  .extend({
    name: z.string().min(1, 'Name is required'),
    code: z
      .string()
      .min(1, 'Code is required')
      .max(20, 'Code max 20 chars')
      .toUpperCase(),
    organizationId: z.string().uuid(),
    companyId: z.string().uuid().optional().nullable(),
    address: z.string().optional().nullable(),
    phone: z.string().optional().nullable(),
    isActive: z.boolean().optional().default(true),
  })

export const updateSucursalSchema = createUpdateSchema(sucursalModel)
  .omit({ id: true, createdAt: true, updatedAt: true })
  .extend({
    name: z.string().min(1, 'Name is required').optional(),
    code: z.string().min(1).max(20).toUpperCase().optional(),
  })

export type CreateSucursalInput = z.infer<typeof createSucursalSchema>
export type UpdateSucursalInput = z.infer<typeof updateSucursalSchema>
