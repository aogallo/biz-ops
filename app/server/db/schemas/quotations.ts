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
import { orderModel, orderSourceType } from './orders'

// Quotation Status ENUM
export const quotationStatus = pgEnum('quotation_status', [
  'DRAFT',
  'SENT',
  'ACCEPTED',
  'REJECTED',
])

export const quotationModel = pgTable('quotation', {
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
  status: quotationStatus('status').notNull().default('DRAFT'),
  quotationDate: date('quotation_date').notNull().defaultNow(),
  quotationNumber: text('quotation_number').notNull(),
  currencyCode: text('currency_code').default('GT'),
  convertedOrderId: uuid('converted_order_id').references(() => orderModel.id),
  ...timestamps,
})

export const quotationDetailModel = pgTable('quotation_detail', {
  id: uuid('id').primaryKey().defaultRandom(),
  quotationId: uuid('quotation_id')
    .notNull()
    .references(() => quotationModel.id),
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

export const quotationRecipientModel = pgTable('quotation_recipient', {
  id: uuid('id').primaryKey().defaultRandom(),
  quotationDetailId: uuid('quotation_detail_id')
    .notNull()
    .references(() => quotationDetailModel.id),
  name: text('name').notNull(),
  metadataJson: jsonb('metadata_json'),
})

// Relations
export const quotationRelations = relations(
  quotationModel,
  ({ one, many }) => ({
    organization: one(organizationModel, {
      fields: [quotationModel.organizationId],
      references: [organizationModel.id],
    }),
    company: one(companyModel, {
      fields: [quotationModel.companyId],
      references: [companyModel.id],
    }),
    businessPartner: one(businessPartnerModel, {
      fields: [quotationModel.businessPartnerId],
      references: [businessPartnerModel.id],
    }),
    convertedOrder: one(orderModel, {
      fields: [quotationModel.convertedOrderId],
      references: [orderModel.id],
    }),
    details: many(quotationDetailModel),
  })
)

export const quotationDetailRelations = relations(
  quotationDetailModel,
  ({ one, many }) => ({
    quotation: one(quotationModel, {
      fields: [quotationDetailModel.quotationId],
      references: [quotationModel.id],
    }),
    product: one(productModel, {
      fields: [quotationDetailModel.productId],
      references: [productModel.id],
    }),
    recipients: many(quotationRecipientModel),
  })
)

export const quotationRecipientRelations = relations(
  quotationRecipientModel,
  ({ one }) => ({
    quotationDetail: one(quotationDetailModel, {
      fields: [quotationRecipientModel.quotationDetailId],
      references: [quotationDetailModel.id],
    }),
  })
)
