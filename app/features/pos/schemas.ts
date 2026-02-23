import { createInsertSchema, createSelectSchema } from 'drizzle-zod'
import { z } from 'zod'
import {
  posTerminalModel,
  posSaleModel,
  posSaleLineModel,
  posPaymentModel,
} from '~/server/db/schemas/pos'

// Terminal schemas
export const insertTerminalSchema = createInsertSchema(posTerminalModel)
export const selectTerminalSchema = createSelectSchema(posTerminalModel)

export const createTerminalSchema = insertTerminalSchema
  .omit({ id: true, createdAt: true, updatedAt: true })
  .extend({
    name: z.string().min(1, 'Terminal name is required'),
    organizationId: z.string().uuid(),
    companyId: z.string().uuid(),
  })

export const updateTerminalSchema = createTerminalSchema.partial()

// Sale schemas
export const selectSaleSchema = createSelectSchema(posSaleModel)
export const selectSaleLineSchema = createSelectSchema(posSaleLineModel)
export const selectPaymentSchema = createSelectSchema(posPaymentModel)

// Checkout input schema
export const checkoutLineSchema = z.object({
  productId: z.string().uuid(),
  productName: z.string(),
  productSku: z.string(),
  quantity: z.number().positive(),
  unitPrice: z.number().nonnegative(),
  discountPercent: z.number().min(0).max(100).default(0),
  ivaType: z.enum(['taxed', 'exempt', 'non_subject']).default('taxed'),
  ivaRate: z.number().default(12),
  productType: z.enum(['STOCK', 'MADE_TO_ORDER', 'SERVICE']).default('STOCK'),
})

export const checkoutPaymentSchema = z.object({
  method: z.enum(['cash', 'card', 'check']),
  amount: z.number().positive(),
  receivedAmount: z.number().nonnegative().optional(),
  changeAmount: z.number().nonnegative().optional(),
  reference: z.string().optional(),
})

export const checkoutSchema = z.object({
  terminalId: z.string().uuid(),
  organizationId: z.string().uuid(),
  companyId: z.string().uuid(),
  cashierId: z.string().uuid(),
  businessPartnerId: z.string().uuid(),
  idempotencyKey: z.string().uuid(),
  lines: z.array(checkoutLineSchema).min(1, 'Cart cannot be empty'),
  payments: z.array(checkoutPaymentSchema).min(1, 'At least one payment required'),
  notes: z.string().optional(),
})

// Types
export type CreateTerminalInput = z.infer<typeof createTerminalSchema>
export type UpdateTerminalInput = z.infer<typeof updateTerminalSchema>
export type CheckoutInput = z.infer<typeof checkoutSchema>
export type CheckoutLine = z.infer<typeof checkoutLineSchema>
export type CheckoutPayment = z.infer<typeof checkoutPaymentSchema>
