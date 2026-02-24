import {
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema,
} from 'drizzle-zod'
import z from 'zod'
import { companyModel } from '~/server/db/schemas/company'

const insertCompanySchema = createInsertSchema(companyModel, {
  name: z.string().min(3),
  code: z
    .string()
    .max(20)
    .regex(/^[A-Z0-9-]+$/, 'Only uppercase letters, numbers, and hyphens')
    .transform((v) => (v && v.trim() !== '' ? v.toUpperCase() : null))
    .optional()
    .nullable(),
})

export const createCompanySchema = insertCompanySchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
})

export const selectCompanySchema = createSelectSchema(companyModel)
export const updateCompanySchema = createUpdateSchema(companyModel)

export type CreateCompanyInput = z.infer<typeof createCompanySchema>
export type UpdateCompanyInput = z.infer<typeof updateCompanySchema>
export type Company = z.infer<typeof selectCompanySchema>
