import { createInsertSchema, createSelectSchema } from 'drizzle-zod'
import { z } from 'zod'
import { serviceModel } from '~/server/db/schemas/service'

// Base schemas from Drizzle
export const insertServiceSchema = createInsertSchema(serviceModel, {
  name: z
    .string()
    .min(1, 'Service name is required')
    .max(100, 'Name must not exceed 100 characters'),
  duration: z
    .number()
    .int('Duration must be a whole number')
    .min(5, 'Duration must be at least 5 minutes')
    .max(480, 'Duration must not exceed 8 hours'),
  color: z.enum(['blue', 'green', 'orange', 'teal', 'purple', 'red', 'yellow']),
  price: z.string().optional(),
  description: z.string().max(500, 'Description must not exceed 500 characters').optional(),
})

export const selectServiceSchema = createSelectSchema(serviceModel)

// Create schema (omit id, timestamps)
export const createServiceSchema = insertServiceSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
})

// Update schema (all fields optional except id)
export const updateServiceSchema = insertServiceSchema
  .partial()
  .required({ id: true })
  .omit({ createdAt: true, updatedAt: true })

// Type exports
export type CreateServiceInput = z.infer<typeof createServiceSchema>
export type UpdateServiceInput = z.infer<typeof updateServiceSchema>
export type Service = z.infer<typeof selectServiceSchema>

// Service color type
export type ServiceColor = 'blue' | 'green' | 'orange' | 'teal' | 'purple' | 'red' | 'yellow'

// Color mapping for UI display
export const serviceColorMap: Record<ServiceColor, { bg: string; text: string; dot: string }> = {
  blue: { bg: 'bg-blue-100', text: 'text-blue-700', dot: 'bg-blue-500' },
  green: { bg: 'bg-green-100', text: 'text-green-700', dot: 'bg-green-500' },
  orange: { bg: 'bg-orange-100', text: 'text-orange-700', dot: 'bg-orange-500' },
  teal: { bg: 'bg-teal-100', text: 'text-teal-700', dot: 'bg-teal-500' },
  purple: { bg: 'bg-purple-100', text: 'text-purple-700', dot: 'bg-purple-500' },
  red: { bg: 'bg-red-100', text: 'text-red-700', dot: 'bg-red-500' },
  yellow: { bg: 'bg-yellow-100', text: 'text-yellow-700', dot: 'bg-yellow-500' },
}
