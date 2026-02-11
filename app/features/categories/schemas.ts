import { createInsertSchema, createSelectSchema } from 'drizzle-zod'
import { z } from 'zod'
import { productCategoryModel } from '~/server/db/schemas/productCategory'

// Base schemas from Drizzle
export const insertCategorySchema = createInsertSchema(productCategoryModel, {
  name: z
    .string()
    .min(1, 'Category name is required')
    .max(100, 'Name must not exceed 100 characters'),
  color: z.enum([
    'blue',
    'green',
    'orange',
    'teal',
    'purple',
    'red',
    'yellow',
    'pink',
    'indigo',
    'gray',
  ]),
})

export const selectCategorySchema = createSelectSchema(productCategoryModel)

// Create schema (omit id, timestamps)
export const createCategorySchema = insertCategorySchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
})

// Update schema (all fields optional except id)
export const updateCategorySchema = insertCategorySchema
  .partial()
  .required({ id: true })
  .omit({ createdAt: true, updatedAt: true })

// Type exports
export type CreateCategoryInput = z.infer<typeof createCategorySchema>
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>
export type ProductCategory = z.infer<typeof selectCategorySchema>

// Category color type
export type CategoryColor =
  | 'blue'
  | 'green'
  | 'orange'
  | 'teal'
  | 'purple'
  | 'red'
  | 'yellow'
  | 'pink'
  | 'indigo'
  | 'gray'

// Color mapping for UI display
export const categoryColorMap: Record<
  CategoryColor,
  { bg: string; text: string; dot: string }
> = {
  blue: { bg: 'bg-blue-100', text: 'text-blue-700', dot: 'bg-blue-500' },
  green: { bg: 'bg-green-100', text: 'text-green-700', dot: 'bg-green-500' },
  orange: {
    bg: 'bg-orange-100',
    text: 'text-orange-700',
    dot: 'bg-orange-500',
  },
  teal: { bg: 'bg-teal-100', text: 'text-teal-700', dot: 'bg-teal-500' },
  purple: {
    bg: 'bg-purple-100',
    text: 'text-purple-700',
    dot: 'bg-purple-500',
  },
  red: { bg: 'bg-red-100', text: 'text-red-700', dot: 'bg-red-500' },
  yellow: {
    bg: 'bg-yellow-100',
    text: 'text-yellow-700',
    dot: 'bg-yellow-500',
  },
  pink: { bg: 'bg-pink-100', text: 'text-pink-700', dot: 'bg-pink-500' },
  indigo: {
    bg: 'bg-indigo-100',
    text: 'text-indigo-700',
    dot: 'bg-indigo-500',
  },
  gray: { bg: 'bg-gray-100', text: 'text-gray-700', dot: 'bg-gray-500' },
}

export const CATEGORY_COLORS: CategoryColor[] = [
  'blue',
  'green',
  'orange',
  'teal',
  'purple',
  'red',
  'yellow',
  'pink',
  'indigo',
  'gray',
]
