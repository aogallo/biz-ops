import { createInsertSchema, createSelectSchema } from 'drizzle-zod'
import { z } from 'zod'
import {
  posTerminalModel,
  posSaleModel,
  posSaleLineModel,
  posPaymentModel,
  posCashierModel,
} from '~/server/db/schemas/pos'

// Terminal schemas
export const insertTerminalSchema = createInsertSchema(posTerminalModel)
export const selectTerminalSchema = createSelectSchema(posTerminalModel)

export const createTerminalSchema = insertTerminalSchema
  .omit({ id: true, createdAt: true, updatedAt: true })
  .extend({
    name: z.string().min(1, 'Terminal name is required'),
    organizationId: z.string().uuid(),
    sucursalId: z.string().uuid().optional().nullable(),
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
  sucursalId: z.string().uuid().optional().nullable(),
  cashierId: z.string().uuid(),
  userId: z.string().uuid().optional().nullable(),
  businessPartnerId: z.string().uuid(),
  idempotencyKey: z.string().uuid(),
  sessionId: z.string().uuid().optional(),
  lines: z.array(checkoutLineSchema).min(1, 'Cart cannot be empty'),
  payments: z.array(checkoutPaymentSchema).min(1, 'At least one payment required'),
  notes: z.string().optional(),
})

// Cashier schemas
export const insertCashierSchema = createInsertSchema(posCashierModel)

export const createCashierSchema = insertCashierSchema
  .omit({ id: true, createdAt: true, updatedAt: true, pinAttempts: true, pinLockedAt: true })
  .extend({
    name: z.string().min(1, 'Name is required'),
    organizationId: z.string().uuid(),
    userId: z.string().uuid().optional().nullable(),
    pin: z.string().min(4).max(6).optional().nullable(),
  })

export const updateCashierSchema = createCashierSchema.partial()

// Session schemas
export const openSessionSchema = z.object({
  terminalId: z.string().uuid(),
  organizationId: z.string().uuid(),
  sucursalId: z.string().uuid().optional().nullable(),
  cashierId: z.string().uuid(),
  openingCashAmount: z.number().nonnegative(),
})

export const closeSessionSchema = z.object({
  sessionId: z.string().uuid(),
  closingCashAmount: z.number().nonnegative(),
  notes: z.string().optional(),
})

// Cash movement schema
export const cashMovementSchema = z.object({
  sessionId: z.string().uuid(),
  type: z.enum(['withdrawal', 'deposit']),
  amount: z.number().positive(),
  notes: z.string().optional(),
})

// Types
export type CreateCashierInput = z.infer<typeof createCashierSchema>
export type UpdateCashierInput = z.infer<typeof updateCashierSchema>
export type OpenSessionInput = z.infer<typeof openSessionSchema>
export type CloseSessionInput = z.infer<typeof closeSessionSchema>
export type CashMovementInput = z.infer<typeof cashMovementSchema>
export type CreateTerminalInput = z.infer<typeof createTerminalSchema>
export type UpdateTerminalInput = z.infer<typeof updateTerminalSchema>
export type CheckoutInput = z.infer<typeof checkoutSchema>
export type CheckoutLine = z.infer<typeof checkoutLineSchema>
export type CheckoutPayment = z.infer<typeof checkoutPaymentSchema>
