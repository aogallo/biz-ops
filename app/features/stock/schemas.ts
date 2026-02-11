import { createInsertSchema, createSelectSchema } from 'drizzle-zod'
import { z } from 'zod'
import { stockMovementModel } from '~/server/db/schemas/stockMovement'

export const insertStockMovementSchema = createInsertSchema(
  stockMovementModel,
  {
    type: z.enum(['entry', 'exit', 'adjustment']),
    quantity: z.number().int().positive('Quantity must be positive'),
    reason: z.string().min(1, 'Reason is required').max(500),
    notes: z.string().max(1000).optional().nullable(),
    productId: z.string().uuid('Invalid product'),
  }
)

export const selectStockMovementSchema =
  createSelectSchema(stockMovementModel)

export const createStockMovementSchema = insertStockMovementSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
})

export type CreateStockMovementInput = z.infer<
  typeof createStockMovementSchema
>
export type StockMovement = z.infer<typeof selectStockMovementSchema>
