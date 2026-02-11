import { relations } from 'drizzle-orm'
import { pgEnum, pgTable, text, uniqueIndex, uuid } from 'drizzle-orm/pg-core'
import { organizationModel } from './auth'
import { timestamps } from './common'
import { productModel } from './products'

// Product category color enum (reuses same palette as service colors)
export const productCategoryColorEnum = pgEnum('product_category_color', [
  'blue',
  'green',
  'orange',
  'teal',
  'purple',
  'red',
  'yellow',
  'pink',
  'indigo',
  'gray',
])

// Product Category model
export const productCategoryModel = pgTable(
  'product_category',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizationModel.id),
    name: text('name').notNull(),
    color: productCategoryColorEnum('color').notNull().default('blue'),
    ...timestamps,
  },
  (table) => [
    uniqueIndex('product_category_org_name_idx').on(
      table.organizationId,
      table.name
    ),
  ]
)

// Relations
export const productCategoryRelations = relations(
  productCategoryModel,
  ({ one, many }) => ({
    organization: one(organizationModel, {
      fields: [productCategoryModel.organizationId],
      references: [organizationModel.id],
    }),
    products: many(productModel),
  })
)
