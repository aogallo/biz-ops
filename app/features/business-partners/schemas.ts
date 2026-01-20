import { createInsertSchema, createSelectSchema } from 'drizzle-zod'
import { z } from 'zod'
import { businessPartnerModel } from '~/server/db/schemas/businessPartner'

// Base schemas from Drizzle
export const insertBusinessPartnerSchema = createInsertSchema(
  businessPartnerModel,
  {
    // Custom validation
    name: z
      .string()
      .min(1, 'Name is required')
      .max(200, 'Name must not exceed 200 characters'),
    type: z.enum(['client', 'vendor', 'both'], {
      message: "Type must be 'client', 'vendor', or 'both'",
    }),
    email: z
      .string()
      .email('Invalid email address')
      .optional()
      .or(z.literal('')),
  }
)

export const selectBusinessPartnerSchema =
  createSelectSchema(businessPartnerModel)

// Create schema (omit id, timestamps)
export const createBusinessPartnerSchema = insertBusinessPartnerSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
})

// Update schema (all fields optional except id)
export const updateBusinessPartnerSchema = insertBusinessPartnerSchema
  .partial()
  .required({ id: true })
  .omit({ createdAt: true, updatedAt: true })

// Type exports
export type CreateBusinessPartnerInput = z.infer<
  typeof createBusinessPartnerSchema
>
export type UpdateBusinessPartnerInput = z.infer<
  typeof updateBusinessPartnerSchema
>
export type BusinessPartner = z.infer<typeof selectBusinessPartnerSchema>
export type PartnerType = 'client' | 'vendor' | 'both'
