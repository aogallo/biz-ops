import { createInsertSchema, createSelectSchema } from 'drizzle-zod'
import { z } from 'zod'
import {
  orderModel,
  orderDetailModel,
  orderRecipientModel,
} from '~/server/db/schemas/orders'

// Base schemas from Drizzle
export const insertOrderSchema = createInsertSchema(orderModel)
export const selectOrderSchema = createSelectSchema(orderModel)
export const insertOrderDetailSchema = createInsertSchema(orderDetailModel)
export const selectOrderDetailSchema = createSelectSchema(orderDetailModel)
export const insertOrderRecipientSchema =
  createInsertSchema(orderRecipientModel)

// Order detail input (for form submission)
export const orderDetailInputSchema = z.object({
  productId: z.string().uuid('Invalid product'),
  productName: z.string().min(1, 'Product name is required'),
  productSku: z.string().nullable().optional(),
  quantity: z.number().int().min(1, 'Quantity must be at least 1'),
  unitPrice: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Invalid price format'),
  sourceType: z.enum(['INVENTORY', 'ON_DEMAND']),
  customAttributesJson: z.record(z.string(), z.unknown()).nullable().optional(),
  recipients: z.array(z.lazy(() => orderRecipientInputSchema)).optional(),
})

// Order recipient input
export const orderRecipientInputSchema = z.object({
  name: z.string().min(1, 'Recipient name is required'),
  metadataJson: z.record(z.string(), z.unknown()).nullable().optional(),
})

// Create order schema
export const createOrderSchema = z.object({
  organizationId: z.string().uuid(),
  companyId: z.string().uuid('Select a company'),
  businessPartnerId: z.string().uuid('Select a business partner'),
  orderDate: z.string().min(1, 'Order date is required'),
  currencyCode: z.string().default('GT'),
  details: z
    .array(orderDetailInputSchema)
    .min(1, 'At least one item is required'),
})

// Type exports
export type CreateOrderInput = z.infer<typeof createOrderSchema>
export type OrderDetailInput = z.infer<typeof orderDetailInputSchema>
export type OrderRecipientInput = z.infer<typeof orderRecipientInputSchema>
export type Order = z.infer<typeof selectOrderSchema>
export type OrderDetail = z.infer<typeof selectOrderDetailSchema>
