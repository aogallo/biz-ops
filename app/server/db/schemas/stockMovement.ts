import { relations } from 'drizzle-orm'
import {
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core'
import { organizationModel, userModel } from './auth'
import { timestamps } from './common'
import { productModel } from './products'

// Stock movement type enum
export const stockMovementTypeEnum = pgEnum('stock_movement_type', [
  'entry',
  'exit',
  'adjustment',
])

// Stock Movement model
export const stockMovementModel = pgTable('stock_movement', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id')
    .notNull()
    .references(() => organizationModel.id),
  productId: uuid('product_id')
    .notNull()
    .references(() => productModel.id),
  type: stockMovementTypeEnum('type').notNull(),
  quantity: integer('quantity').notNull(), // always positive, type determines direction
  reason: text('reason').notNull(),
  referenceType: text('reference_type'), // 'invoice' | 'manual'
  referenceId: uuid('reference_id'), // invoiceId if from invoice
  notes: text('notes'),
  createdById: uuid('created_by_id').references(() => userModel.id),
  movementDate: timestamp('movement_date').defaultNow().notNull(),
  ...timestamps,
})

// Relations
export const stockMovementRelations = relations(
  stockMovementModel,
  ({ one }) => ({
    organization: one(organizationModel, {
      fields: [stockMovementModel.organizationId],
      references: [organizationModel.id],
    }),
    product: one(productModel, {
      fields: [stockMovementModel.productId],
      references: [productModel.id],
    }),
    createdBy: one(userModel, {
      fields: [stockMovementModel.createdById],
      references: [userModel.id],
    }),
  })
)
