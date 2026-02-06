import { relations } from 'drizzle-orm'
import {
  date,
  integer,
  numeric,
  pgEnum,
  pgTable,
  text,
  uuid,
} from 'drizzle-orm/pg-core'
import {
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema,
} from 'drizzle-zod'
import type { z } from 'zod'
import { accountingAccountModel } from './accounting'
import { organizationModel } from './auth'
import { businessPartnerModel } from './businessPartner'
import { timestamps } from './common'
import { companyModel } from './company'
import { productModel } from './products'
import { satFileModel } from './sat-file'

// Enums
export const invoiceTypeEnum = pgEnum('invoice_type', ['purchase', 'sale'])
export const invoiceSourceEnum = pgEnum('invoice_source', ['manual', 'sat'])

export const invoiceStatusEnum = pgEnum('invoice_status', [
  'draft',
  'pending',
  'posted',
  'voided',
])

export const ivaTypeEnum = pgEnum('iva_type', [
  'taxed',
  'exempt',
  'non_subject',
])

// Invoice Model
export const invoiceModel = pgTable('invoice', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id')
    .notNull()
    .references(() => organizationModel.id),
  companyId: uuid('company_id')
    .notNull()
    .references(() => companyModel.id),
  businessPartnerId: uuid('business_partner_id')
    .notNull()
    .references(() => businessPartnerModel.id),
  satFileId: uuid('sat_file_id').references(() => satFileModel.id),
  type: invoiceTypeEnum('type').notNull(),
  number: text('number').notNull(),
  authorizationNumber: text('authorization_number'),
  serie: text('serie'),
  invoiceDate: date('invoice_date').notNull(),
  dueDate: date('due_date'),
  subtotal: numeric('subtotal', { precision: 12, scale: 2 })
    .notNull()
    .default('0'),
  ivaAmount: numeric('iva_amount', { precision: 12, scale: 2 })
    .notNull()
    .default('0'),
  total: numeric('total', { precision: 12, scale: 2 }).notNull(),
  currency: text('currency').notNull().default('GTQ'),
  status: invoiceStatusEnum('status').notNull().default('draft'),
  source: invoiceSourceEnum('source').notNull().default('manual'),
  ...timestamps,
})

// Invoice Line Model
export const invoiceLineModel = pgTable('invoice_line', {
  id: uuid('id').primaryKey().defaultRandom(),
  invoiceId: uuid('invoice_id')
    .notNull()
    .references(() => invoiceModel.id, { onDelete: 'cascade' }),
  lineNumber: integer('line_number').notNull(),
  description: text('description').notNull(),
  quantity: numeric('quantity', { precision: 12, scale: 4 })
    .notNull()
    .default('1'),
  unitPrice: numeric('unit_price', { precision: 12, scale: 2 })
    .notNull()
    .default('0'),
  subtotal: numeric('subtotal', { precision: 12, scale: 2 })
    .notNull()
    .default('0'),
  ivaType: ivaTypeEnum('iva_type').notNull().default('taxed'),
  ivaRate: numeric('iva_rate', { precision: 5, scale: 2 })
    .notNull()
    .default('12.00'),
  ivaAmount: numeric('iva_amount', { precision: 12, scale: 2 })
    .notNull()
    .default('0'),
  total: numeric('total', { precision: 12, scale: 2 }).notNull().default('0'),
  productId: uuid('product_id').references(() => productModel.id),
  accountingAccountId: uuid('accounting_account_id')
    .notNull()
    .references(() => accountingAccountModel.id),
  ...timestamps,
})

// Relations
export const invoiceRelations = relations(invoiceModel, ({ one, many }) => ({
  organization: one(organizationModel, {
    fields: [invoiceModel.organizationId],
    references: [organizationModel.id],
  }),
  company: one(companyModel, {
    fields: [invoiceModel.companyId],
    references: [companyModel.id],
  }),
  businessPartner: one(businessPartnerModel, {
    fields: [invoiceModel.businessPartnerId],
    references: [businessPartnerModel.id],
  }),
  satFile: one(satFileModel, {
    fields: [invoiceModel.satFileId],
    references: [satFileModel.id],
  }),
  lines: many(invoiceLineModel),
}))

export const invoiceLineRelations = relations(invoiceLineModel, ({ one }) => ({
  invoice: one(invoiceModel, {
    fields: [invoiceLineModel.invoiceId],
    references: [invoiceModel.id],
  }),
  product: one(productModel, {
    fields: [invoiceLineModel.productId],
    references: [productModel.id],
  }),
  accountingAccount: one(accountingAccountModel, {
    fields: [invoiceLineModel.accountingAccountId],
    references: [accountingAccountModel.id],
  }),
}))

// Schemas
export const selectInvoiceSchema = createSelectSchema(invoiceModel)
export const insertInvoiceSchema = createInsertSchema(invoiceModel)
export const updateInvoiceSchema = createUpdateSchema(invoiceModel)

export const selectInvoiceLineSchema = createSelectSchema(invoiceLineModel)
export const insertInvoiceLineSchema = createInsertSchema(invoiceLineModel)
export const updateInvoiceLineSchema = createUpdateSchema(invoiceLineModel)

// Types
export type Invoice = z.infer<typeof selectInvoiceSchema>
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>
export type InvoiceLine = z.infer<typeof selectInvoiceLineSchema>
export type InsertInvoiceLine = z.infer<typeof insertInvoiceLineSchema>
export type InvoiceType = 'purchase' | 'sale'
export type InvoiceStatus = 'draft' | 'pending' | 'posted' | 'voided'
export type IvaType = 'taxed' | 'exempt' | 'non_subject'
export type InvoiceSource = 'manual' | 'sat'
