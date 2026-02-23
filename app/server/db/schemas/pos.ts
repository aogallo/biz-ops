import { relations } from 'drizzle-orm'
import {
  boolean,
  index,
  integer,
  numeric,
  pgEnum,
  pgTable,
  text,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'
import {
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema,
} from 'drizzle-zod'
import type { z } from 'zod'
import { organizationModel, userModel } from './auth'
import { businessPartnerModel } from './businessPartner'
import { timestamps } from './common'
import { companyModel } from './company'
import { invoiceModel, ivaTypeEnum } from './invoice'
import { productModel } from './products'

// Enums
export const posSaleStatusEnum = pgEnum('pos_sale_status', [
  'completed',
  'voided',
  'refunded',
])

export const posPaymentMethodEnum = pgEnum('pos_payment_method', [
  'cash',
  'card',
  'check',
])

// POS Terminal
export const posTerminalModel = pgTable('pos_terminal', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id')
    .notNull()
    .references(() => organizationModel.id),
  companyId: uuid('company_id')
    .notNull()
    .references(() => companyModel.id),
  name: text('name').notNull(),
  isActive: boolean('is_active').notNull().default(true),
  autoGenerateInvoice: boolean('auto_generate_invoice')
    .notNull()
    .default(false),
  defaultBusinessPartnerId: uuid('default_business_partner_id').references(
    () => businessPartnerModel.id
  ),
  ...timestamps,
}, (table) => [
  index('pos_terminal_org_active_idx').on(table.organizationId, table.isActive),
])

// POS Sale
export const posSaleModel = pgTable('pos_sale', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id')
    .notNull()
    .references(() => organizationModel.id),
  companyId: uuid('company_id')
    .notNull()
    .references(() => companyModel.id),
  terminalId: uuid('terminal_id')
    .notNull()
    .references(() => posTerminalModel.id),
  cashierId: uuid('cashier_id')
    .notNull()
    .references(() => userModel.id),
  businessPartnerId: uuid('business_partner_id')
    .notNull()
    .references(() => businessPartnerModel.id),
  saleNumber: text('sale_number').notNull(),
  idempotencyKey: uuid('idempotency_key'),
  status: posSaleStatusEnum('status').notNull().default('completed'),
  subtotal: numeric('subtotal', { precision: 12, scale: 2 }).notNull(),
  ivaAmount: numeric('iva_amount', { precision: 12, scale: 2 })
    .notNull()
    .default('0'),
  discountAmount: numeric('discount_amount', { precision: 12, scale: 2 })
    .notNull()
    .default('0'),
  total: numeric('total', { precision: 12, scale: 2 }).notNull(),
  currency: text('currency').notNull().default('GTQ'),
  invoiceId: uuid('invoice_id').references(() => invoiceModel.id),
  notes: text('notes'),
  ...timestamps,
}, (table) => [
  uniqueIndex('pos_sale_idempotency_key_idx').on(table.idempotencyKey),
  index('pos_sale_terminal_created_idx').on(table.terminalId, table.createdAt),
  index('pos_sale_status_idx').on(table.status),
  index('pos_sale_org_created_idx').on(table.organizationId, table.createdAt),
])

// POS Sale Line
export const posSaleLineModel = pgTable('pos_sale_line', {
  id: uuid('id').primaryKey().defaultRandom(),
  saleId: uuid('sale_id')
    .notNull()
    .references(() => posSaleModel.id, { onDelete: 'cascade' }),
  lineNumber: integer('line_number').notNull(),
  productId: uuid('product_id')
    .notNull()
    .references(() => productModel.id),
  productName: text('product_name').notNull(),
  productSku: text('product_sku').notNull(),
  quantity: numeric('quantity', { precision: 12, scale: 4 })
    .notNull()
    .default('1'),
  unitPrice: numeric('unit_price', { precision: 12, scale: 2 }).notNull(),
  discountPercent: numeric('discount_percent', { precision: 5, scale: 2 })
    .notNull()
    .default('0'),
  discountAmount: numeric('discount_amount', { precision: 12, scale: 2 })
    .notNull()
    .default('0'),
  subtotal: numeric('subtotal', { precision: 12, scale: 2 }).notNull(),
  ivaType: ivaTypeEnum('iva_type').notNull().default('taxed'),
  ivaRate: numeric('iva_rate', { precision: 5, scale: 2 })
    .notNull()
    .default('12.00'),
  ivaAmount: numeric('iva_amount', { precision: 12, scale: 2 })
    .notNull()
    .default('0'),
  total: numeric('total', { precision: 12, scale: 2 }).notNull(),
  ...timestamps,
})

// POS Payment
export const posPaymentModel = pgTable('pos_payment', {
  id: uuid('id').primaryKey().defaultRandom(),
  saleId: uuid('sale_id')
    .notNull()
    .references(() => posSaleModel.id, { onDelete: 'cascade' }),
  method: posPaymentMethodEnum('method').notNull(),
  amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
  receivedAmount: numeric('received_amount', { precision: 12, scale: 2 }),
  changeAmount: numeric('change_amount', { precision: 12, scale: 2 }),
  reference: text('reference'),
  ...timestamps,
})

// Relations
export const posTerminalRelations = relations(
  posTerminalModel,
  ({ one, many }) => ({
    organization: one(organizationModel, {
      fields: [posTerminalModel.organizationId],
      references: [organizationModel.id],
    }),
    company: one(companyModel, {
      fields: [posTerminalModel.companyId],
      references: [companyModel.id],
    }),
    defaultBusinessPartner: one(businessPartnerModel, {
      fields: [posTerminalModel.defaultBusinessPartnerId],
      references: [businessPartnerModel.id],
    }),
    sales: many(posSaleModel),
  })
)

export const posSaleRelations = relations(posSaleModel, ({ one, many }) => ({
  organization: one(organizationModel, {
    fields: [posSaleModel.organizationId],
    references: [organizationModel.id],
  }),
  company: one(companyModel, {
    fields: [posSaleModel.companyId],
    references: [companyModel.id],
  }),
  terminal: one(posTerminalModel, {
    fields: [posSaleModel.terminalId],
    references: [posTerminalModel.id],
  }),
  cashier: one(userModel, {
    fields: [posSaleModel.cashierId],
    references: [userModel.id],
  }),
  businessPartner: one(businessPartnerModel, {
    fields: [posSaleModel.businessPartnerId],
    references: [businessPartnerModel.id],
  }),
  invoice: one(invoiceModel, {
    fields: [posSaleModel.invoiceId],
    references: [invoiceModel.id],
  }),
  lines: many(posSaleLineModel),
  payments: many(posPaymentModel),
}))

export const posSaleLineRelations = relations(posSaleLineModel, ({ one }) => ({
  sale: one(posSaleModel, {
    fields: [posSaleLineModel.saleId],
    references: [posSaleModel.id],
  }),
  product: one(productModel, {
    fields: [posSaleLineModel.productId],
    references: [productModel.id],
  }),
}))

export const posPaymentRelations = relations(posPaymentModel, ({ one }) => ({
  sale: one(posSaleModel, {
    fields: [posPaymentModel.saleId],
    references: [posSaleModel.id],
  }),
}))

// Schemas
export const selectPosTerminalSchema = createSelectSchema(posTerminalModel)
export const insertPosTerminalSchema = createInsertSchema(posTerminalModel)
export const updatePosTerminalSchema = createUpdateSchema(posTerminalModel)

export const selectPosSaleSchema = createSelectSchema(posSaleModel)
export const insertPosSaleSchema = createInsertSchema(posSaleModel)

export const selectPosSaleLineSchema = createSelectSchema(posSaleLineModel)
export const insertPosSaleLineSchema = createInsertSchema(posSaleLineModel)

export const selectPosPaymentSchema = createSelectSchema(posPaymentModel)
export const insertPosPaymentSchema = createInsertSchema(posPaymentModel)

// Types
export type PosTerminal = z.infer<typeof selectPosTerminalSchema>
export type InsertPosTerminal = z.infer<typeof insertPosTerminalSchema>
export type PosSale = z.infer<typeof selectPosSaleSchema>
export type InsertPosSale = z.infer<typeof insertPosSaleSchema>
export type PosSaleLine = z.infer<typeof selectPosSaleLineSchema>
export type InsertPosSaleLine = z.infer<typeof insertPosSaleLineSchema>
export type PosPayment = z.infer<typeof selectPosPaymentSchema>
export type InsertPosPayment = z.infer<typeof insertPosPaymentSchema>
export type PosSaleStatus = 'completed' | 'voided' | 'refunded'
export type PosPaymentMethod = 'cash' | 'card' | 'check'
