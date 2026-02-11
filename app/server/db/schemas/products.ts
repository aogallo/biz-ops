import { relations } from 'drizzle-orm'
import {
  integer,
  numeric,
  pgTable,
  text,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'
import { organizationModel } from './auth'
import { timestamps } from './common'
import { productCategoryModel } from './productCategory'

// Products & Inventory
export const productModel = pgTable(
  'product',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizationModel.id),
    categoryId: uuid('category_id').references(() => productCategoryModel.id),
    sku: text('sku').notNull(),
    name: text('name').notNull(),
    description: text('description'),
    imageUrl: text('image_url'),
    price: numeric('price', { precision: 12, scale: 2 }).notNull(),
    stock: integer('stock').default(0),
    minStock: integer('min_stock').default(0),
    ...timestamps,
  },
  (table) => [
    // Composite unique constraint: SKU must be unique per organization
    uniqueIndex('product_sku_org_idx').on(table.organizationId, table.sku),
  ]
)

// Relations
export const productRelations = relations(productModel, ({ one }) => ({
  organization: one(organizationModel, {
    fields: [productModel.organizationId],
    references: [organizationModel.id],
  }),
  category: one(productCategoryModel, {
    fields: [productModel.categoryId],
    references: [productCategoryModel.id],
  }),
}))
