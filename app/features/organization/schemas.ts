import {
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema,
} from 'drizzle-zod'
import { z } from 'zod'
import { organizationModel } from '~/server/db/schemas/auth'

export const organizationCreateSchema = createInsertSchema(organizationModel, {
  domain: z
    .string()
    .trim()
    .regex(/^[a-z0-9-]+$/, 'Only lowercase letters, numbers and hyphens')
    .optional(),
  logo: z.string().optional(),
}).omit({
  id: true,
})

export const selectOrganizationSchema = createSelectSchema(
  organizationModel
).omit({ updatedAt: true, metadata: true, domain: true })

export const organizationUpdateSchema = createUpdateSchema(organizationModel)

export type OrganizationCreate = z.infer<typeof organizationCreateSchema>
export type OrganizationUpdate = z.infer<typeof organizationUpdateSchema>
export type Organization = z.infer<typeof selectOrganizationSchema>
