import { relations } from 'drizzle-orm'
import {
  boolean,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  text,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'
import { organizationModel } from './auth'
import { timestamps } from './common'
import { productCategoryModel } from './productCategory'

// Product type ENUM — includes combo/recipe/ingredient for kitchen system
export const productTypeEnum = pgEnum('product_type', [
  'STOCK', // Uses inventory
  'MADE_TO_ORDER', // Produced when ordered
  'SERVICE', // No physical product
  'ingredient', // Raw ingredient (no direct sale)
  'recipe', // Recipe/prepared dish
  'combo', // Combo meal (parent, groups of choices)
  'sale_item', // Sellable item variant
])

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
    productType: productTypeEnum('product_type').notNull().default('STOCK'),
    trackInventory: boolean('track_inventory').notNull().default(true),
    unitOfMeasureId: uuid('unit_of_measure_id'),
    attributesJson: jsonb('attributes_json'),
    ...timestamps,
  },
  (table) => [
    uniqueIndex('product_sku_org_idx').on(table.organizationId, table.sku),
    index('product_org_type_idx').on(table.organizationId, table.productType),
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
