import { createInsertSchema, createSelectSchema } from 'drizzle-zod'
import { z } from 'zod'
import {
  quotationModel,
  quotationDetailModel,
  quotationRecipientModel,
} from '~/server/db/schemas/quotations'

// Base schemas from Drizzle
export const insertQuotationSchema = createInsertSchema(quotationModel)
export const selectQuotationSchema = createSelectSchema(quotationModel)
export const insertQuotationDetailSchema = createInsertSchema(quotationDetailModel)
export const selectQuotationDetailSchema = createSelectSchema(quotationDetailModel)
export const insertQuotationRecipientSchema = createInsertSchema(quotationRecipientModel)

// Quotation detail input (for form submission)
export const quotationDetailInputSchema = z.object({
  productId: z.string().uuid('Invalid product'),
  productName: z.string().min(1, 'Product name is required'),
  productSku: z.string().nullable().optional(),
  quantity: z.number().int().min(1, 'Quantity must be at least 1'),
  unitPrice: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Invalid price format'),
  sourceType: z.enum(['INVENTORY', 'ON_DEMAND']),
  customAttributesJson: z.record(z.string(), z.unknown()).nullable().optional(),
  recipients: z.array(z.lazy(() => quotationRecipientInputSchema)).optional(),
})

// Quotation recipient input
export const quotationRecipientInputSchema = z.object({
  name: z.string().min(1, 'Recipient name is required'),
  metadataJson: z.record(z.string(), z.unknown()).nullable().optional(),
})

// Create quotation schema
export const createQuotationSchema = z.object({
  organizationId: z.string().uuid(),
  companyId: z.string().uuid('Select a company'),
  businessPartnerId: z.string().uuid('Select a business partner'),
  quotationDate: z.string().min(1, 'Quotation date is required'),
  currencyCode: z.string().default('GT'),
  details: z.array(quotationDetailInputSchema).min(1, 'At least one item is required'),
})

// Type exports
export type CreateQuotationInput = z.infer<typeof createQuotationSchema>
export type QuotationDetailInput = z.infer<typeof quotationDetailInputSchema>
export type QuotationRecipientInput = z.infer<typeof quotationRecipientInputSchema>
export type Quotation = z.infer<typeof selectQuotationSchema>
export type QuotationDetail = z.infer<typeof selectQuotationDetailSchema>
