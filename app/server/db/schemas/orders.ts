import { relations } from 'drizzle-orm'
import {
  date,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  text,
  uuid,
} from 'drizzle-orm/pg-core'
import { organizationModel } from './auth'
import { companyModel } from './company'
import { timestamps } from './common'
import { productModel } from './products'
import { businessPartnerModel } from './businessPartner'

// Order Source Type EMUN
export const orderSourceType = pgEnum('order_source_type', [
  'INVENTORY',
  'ON_DEMAND',
])

// Order Status EMUN
export const orderStatus = pgEnum('order_status', [
  'DRAFT',
  'CONFIRMED',
  'COMPLETED',
  'CANCELLED',
])

export const orderModel = pgTable('order', {
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
  status: orderStatus('status').notNull().default('DRAFT'),
  orderDate: date('order_date').notNull().defaultNow(),
  orderNumber: text('order_number').notNull(),
  currencyCode: text('currency_code').default('GT'),
  ...timestamps,
})

export const orderDetailModel = pgTable('order_detail', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderId: uuid('order_id')
    .notNull()
    .references(() => orderModel.id),
  productId: uuid('product_id')
    .notNull()
    .references(() => productModel.id),
  productName: text('product_name').notNull(),
  productSku: text('product_sku'),
  quantity: integer('quantity').notNull(),
  unitPrice: numeric('unit_price', { precision: 12, scale: 2 }).notNull(),
  sourceType: orderSourceType('source_type').notNull(),
  lineTotal: numeric('line_total', { precision: 12, scale: 2 }).notNull(),
  customAttributesJson: jsonb('custom_attributes_json'),
})

export const orderRecipientModel = pgTable('order_recipient', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderDetailId: uuid('order_detail_id')
    .notNull()
    .references(() => orderDetailModel.id),
  name: text('name').notNull(),
  metadataJson: jsonb('metadata_json'),
})

// Relations
export const orderRelations = relations(orderModel, ({ one, many }) => ({
  organization: one(organizationModel, {
    fields: [orderModel.organizationId],
    references: [organizationModel.id],
  }),
  company: one(companyModel, {
    fields: [orderModel.companyId],
    references: [companyModel.id],
  }),
  businessPartner: one(businessPartnerModel, {
    fields: [orderModel.businessPartnerId],
    references: [businessPartnerModel.id],
  }),
  details: many(orderDetailModel),
}))

export const orderDetailRelations = relations(orderDetailModel, ({ one, many }) => ({
  order: one(orderModel, {
    fields: [orderDetailModel.orderId],
    references: [orderModel.id],
  }),
  product: one(productModel, {
    fields: [orderDetailModel.productId],
    references: [productModel.id],
  }),
  recipients: many(orderRecipientModel),
}))

export const orderRecipientRelations = relations(
  orderRecipientModel,
  ({ one }) => ({
    orderDetail: one(orderDetailModel, {
      fields: [orderRecipientModel.orderDetailId],
      references: [orderDetailModel.id],
    }),
  })
)
