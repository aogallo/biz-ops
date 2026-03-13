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
import { organizationModel } from './auth'
import { timestamps } from './common'
import { companyModel } from './company'
import { productModel } from './products'

// Inventory movement type enum
export const inventoryMovementTypeEnum = pgEnum('inventory_movement_type', [
  'in',
  'out',
  'transfer_to_sucursal',
  'transfer_from_sucursal',
  'adjustment',
])

// Sucursal (physical branch/location)
export const sucursalModel = pgTable(
  'sucursal',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizationModel.id),
    companyId: uuid('company_id').references(() => companyModel.id),
    name: text('name').notNull(),
    code: text('code').notNull(),
    address: text('address'),
    phone: text('phone'),
    isActive: boolean('is_active').notNull().default(true),
    invoicePrefix: text('invoice_prefix').notNull().default('M'),
    nextInvoiceNumber: integer('next_invoice_number').notNull().default(1),
    kitchenPin: text('kitchen_pin'),
    ...timestamps,
  },
  (table) => [
    uniqueIndex('sucursal_code_org_idx').on(table.organizationId, table.code),
    index('sucursal_org_active_idx').on(table.organizationId, table.isActive),
  ]
)

// Sucursal inventory (per-branch stock levels)
export const sucursalInventoryModel = pgTable(
  'sucursal_inventory',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    sucursalId: uuid('sucursal_id')
      .notNull()
      .references(() => sucursalModel.id, { onDelete: 'cascade' }),
    productId: uuid('product_id')
      .notNull()
      .references(() => productModel.id, { onDelete: 'cascade' }),
    stock: numeric('stock', { precision: 12, scale: 4 }).notNull().default('0'),
    minStock: integer('min_stock').notNull().default(0),
    ...timestamps,
  },
  (table) => [
    uniqueIndex('sucursal_inventory_sucursal_product_idx').on(
      table.sucursalId,
      table.productId
    ),
    index('sucursal_inventory_sucursal_idx').on(table.sucursalId),
  ]
)

// Inventory movement log
export const inventoryMovementModel = pgTable(
  'inventory_movement',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizationModel.id),
    sucursalId: uuid('sucursal_id').references(() => sucursalModel.id),
    productId: uuid('product_id')
      .notNull()
      .references(() => productModel.id),
    type: inventoryMovementTypeEnum('type').notNull(),
    quantity: numeric('quantity', { precision: 12, scale: 4 }).notNull(),
    referenceType: text('reference_type'),
    referenceId: uuid('reference_id'),
    unitOfMeasureId: uuid('unit_of_measure_id'),
    notes: text('notes'),
    createdBy: uuid('created_by'),
    ...timestamps,
  },
  (table) => [
    index('inventory_movement_org_idx').on(
      table.organizationId,
      table.createdAt
    ),
    index('inventory_movement_product_idx').on(table.productId),
    index('inventory_movement_sucursal_idx').on(table.sucursalId),
  ]
)

// Relations
export const sucursalRelations = relations(sucursalModel, ({ one, many }) => ({
  organization: one(organizationModel, {
    fields: [sucursalModel.organizationId],
    references: [organizationModel.id],
  }),
  company: one(companyModel, {
    fields: [sucursalModel.companyId],
    references: [companyModel.id],
  }),
  inventory: many(sucursalInventoryModel),
  movements: many(inventoryMovementModel),
}))

export const sucursalInventoryRelations = relations(
  sucursalInventoryModel,
  ({ one }) => ({
    sucursal: one(sucursalModel, {
      fields: [sucursalInventoryModel.sucursalId],
      references: [sucursalModel.id],
    }),
    product: one(productModel, {
      fields: [sucursalInventoryModel.productId],
      references: [productModel.id],
    }),
  })
)

export const inventoryMovementRelations = relations(
  inventoryMovementModel,
  ({ one }) => ({
    organization: one(organizationModel, {
      fields: [inventoryMovementModel.organizationId],
      references: [organizationModel.id],
    }),
    sucursal: one(sucursalModel, {
      fields: [inventoryMovementModel.sucursalId],
      references: [sucursalModel.id],
    }),
    product: one(productModel, {
      fields: [inventoryMovementModel.productId],
      references: [productModel.id],
    }),
  })
)

// Schemas
export const selectSucursalSchema = createSelectSchema(sucursalModel)
export const insertSucursalSchema = createInsertSchema(sucursalModel)
export const updateSucursalSchema = createUpdateSchema(sucursalModel)

export const selectSucursalInventorySchema = createSelectSchema(
  sucursalInventoryModel
)
export const insertSucursalInventorySchema = createInsertSchema(
  sucursalInventoryModel
)

export const selectInventoryMovementSchema = createSelectSchema(
  inventoryMovementModel
)
export const insertInventoryMovementSchema = createInsertSchema(
  inventoryMovementModel
)

// Types
export type Sucursal = z.infer<typeof selectSucursalSchema>
export type InsertSucursal = z.infer<typeof insertSucursalSchema>
export type UpdateSucursal = z.infer<typeof updateSucursalSchema>
export type SucursalInventory = z.infer<typeof selectSucursalInventorySchema>
export type InventoryMovement = z.infer<typeof selectInventoryMovementSchema>
