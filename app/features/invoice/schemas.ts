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

// Types
export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>
export type CreateInvoiceLineInput = z.infer<typeof createInvoiceLineSchema>
