import { createInsertSchema, createSelectSchema } from 'drizzle-zod'
import { z } from 'zod'
import { comboModel } from '~/server/db/schemas/combo'

export const insertComboSchema = createInsertSchema(comboModel)
export const selectComboSchema = createSelectSchema(comboModel)

export const comboGroupItemInputSchema = z.object({
  productId: z.string().uuid(),
  isDefault: z.boolean().default(false),
  priceAdjustment: z.number().default(0),
  sortOrder: z.number().int().default(0),
})

export const comboGroupInputSchema = z.object({
  name: z.string().min(1, 'Group name is required'),
  minSelect: z.number().int().min(0).default(1),
  maxSelect: z.number().int().min(1).default(1),
  isRequired: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
  items: z.array(comboGroupItemInputSchema).min(1, 'At least one item per group'),
})

export const upsertComboSchema = z.object({
  productId: z.string().uuid(),
  groups: z.array(comboGroupInputSchema).min(1, 'At least one group required'),
})

export interface PosComboDefinition {
  comboId: string
  productId: string
  groups: Array<{
    id: string
    name: string
    minSelect: number
    maxSelect: number
    isRequired: boolean
    sortOrder: number
    items: Array<{
      id: string
      productId: string
      productName: string
      productSku: string
      isDefault: boolean
      priceAdjustment: number
      sortOrder: number
    }>
  }>
}

export type ComboGroupItemInput = z.infer<typeof comboGroupItemInputSchema>
export type ComboGroupInput = z.infer<typeof comboGroupInputSchema>
export type UpsertComboInput = z.infer<typeof upsertComboSchema>
