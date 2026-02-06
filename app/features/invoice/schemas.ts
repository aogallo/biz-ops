import { z } from 'zod'
import {
  insertInvoiceLineSchema,
  insertInvoiceSchema,
  selectInvoiceLineSchema,
  selectInvoiceSchema,
} from '~/server/db/schemas/invoice'

// Base schemas from drizzle-zod
export { selectInvoiceLineSchema, selectInvoiceSchema }

// Schema for creating an invoice line
export const createInvoiceLineSchema = insertInvoiceLineSchema
  .omit({
    id: true,
    invoiceId: true,
    createdAt: true,
    updatedAt: true,
  })
  .extend({
    quantity: z.coerce.number().positive(),
    unitPrice: z.coerce.number().min(0),
    subtotal: z.coerce.number().min(0),
    ivaAmount: z.coerce.number().min(0),
    total: z.coerce.number().min(0),
    ivaRate: z.coerce.number().min(0).max(100).default(12),
  })

// Schema for creating an invoice
export const createInvoiceSchema = insertInvoiceSchema
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
  })
  .extend({
    subtotal: z.coerce.number().min(0),
    ivaAmount: z.coerce.number().min(0),
    total: z.coerce.number().min(0),
    lines: z.array(createInvoiceLineSchema).optional(),
  })

// Schema for creating a draft invoice (minimal info)
export const createDraftInvoiceSchema = z.object({
  organizationId: z.string().uuid(),
  companyId: z.string().uuid(),
  businessPartnerId: z.string().uuid(),
  accountingAccountId: z.string().uuid(),
  type: z.enum(['purchase', 'sale']),
  invoiceDate: z.coerce.date(),
  dueDate: z.coerce.date().optional().nullable(),
})

// Schema for updating an invoice
export const updateInvoiceSchema = z.object({
  invoiceDate: z.coerce.date().optional(),
  dueDate: z.coerce.date().optional().nullable(),
  businessPartnerId: z.string().uuid().optional(),
  accountingAccountId: z.string().uuid().optional(),
  serie: z.string().max(20).optional().nullable(),
  authorizationNumber: z.string().max(50).optional().nullable(),
})

// Schema for adding a line to an invoice
export const addInvoiceLineSchema = z.object({
  invoiceId: z.string().uuid(),
  description: z.string().min(1, 'Description is required'),
  quantity: z.coerce.number().positive('Quantity must be positive'),
  unitPrice: z.coerce.number().min(0, 'Unit price must be non-negative'),
  ivaType: z.enum(['taxed', 'exempt', 'non_subject']).default('taxed'),
  ivaRate: z.coerce.number().min(0).max(100).default(12),
  productId: z.string().uuid().optional().nullable(),
})

// Schema for updating an invoice line
export const updateInvoiceLineSchema = z.object({
  lineId: z.string().uuid(),
  description: z.string().min(1).optional(),
  quantity: z.coerce.number().positive().optional(),
  unitPrice: z.coerce.number().min(0).optional(),
  ivaType: z.enum(['taxed', 'exempt', 'non_subject']).optional(),
  ivaRate: z.coerce.number().min(0).max(100).optional(),
  productId: z.string().uuid().optional().nullable(),
})

// Schema for posting an invoice
export const postInvoiceSchema = z.object({
  invoiceId: z.string().uuid(),
})

// Schema for voiding an invoice
export const voidInvoiceSchema = z.object({
  invoiceId: z.string().uuid(),
  reason: z.string().min(1, 'Reason is required').max(500),
})

// Types
export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>
export type CreateInvoiceLineInput = z.infer<typeof createInvoiceLineSchema>
export type CreateDraftInvoiceInput = z.infer<typeof createDraftInvoiceSchema>
export type UpdateInvoiceInput = z.infer<typeof updateInvoiceSchema>
export type AddInvoiceLineInput = z.infer<typeof addInvoiceLineSchema>
export type UpdateInvoiceLineInput = z.infer<typeof updateInvoiceLineSchema>
export type PostInvoiceInput = z.infer<typeof postInvoiceSchema>
export type VoidInvoiceInput = z.infer<typeof voidInvoiceSchema>
