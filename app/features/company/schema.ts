import { createInsertSchema, createSelectSchema } from 'drizzle-zod'
import z from 'zod'
import { companyModel } from '~/server/db/schemas/company'

const codeSchema = z
  .string()
  .min(1, 'Code is required')
  .max(20)
  .regex(/^[A-Z0-9-]+$/, 'Only uppercase letters, numbers, and hyphens')
  .transform((v) => v.trim().toUpperCase())

const insertCompanySchema = createInsertSchema(companyModel, {
  name: z.string().min(3),
  code: codeSchema,
})

export const createCompanySchema = insertCompanySchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
})

export const selectCompanySchema = createSelectSchema(companyModel)

export const updateCompanySchema = insertCompanySchema
  .omit({ id: true, createdAt: true, updatedAt: true, organizationId: true })
  .extend({ code: codeSchema })

export type CreateCompanyInput = z.infer<typeof createCompanySchema>
export type UpdateCompanyInput = z.infer<typeof updateCompanySchema>
export type Company = z.infer<typeof selectCompanySchema>
