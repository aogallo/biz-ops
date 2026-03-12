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
  uuid,
} from 'drizzle-orm/pg-core'
import { createInsertSchema, createSelectSchema } from 'drizzle-zod'
import type { z } from 'zod'
import { organizationModel } from './auth'
import { timestamps } from './common'
import { productModel } from './products'
import { posSaleModel } from './pos'
import { sucursalModel } from './sucursal'

export const kitchenTicketStatusEnum = pgEnum('kitchen_ticket_status', [
  'pending',
  'in_progress',
  'ready',
  'served',
])

export const kitchenItemStatusEnum = pgEnum('kitchen_item_status', [
  'pending',
  'ready',
])

export const kitchenStationModel = pgTable('kitchen_station', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id')
    .notNull()
    .references(() => organizationModel.id),
  sucursalId: uuid('sucursal_id').references(() => sucursalModel.id),
  name: text('name').notNull(),
  isActive: boolean('is_active').notNull().default(true),
  ...timestamps,
})

export const kitchenTicketModel = pgTable(
  'kitchen_ticket',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizationModel.id),
    sucursalId: uuid('sucursal_id').references(() => sucursalModel.id),
    saleId: uuid('sale_id').references(() => posSaleModel.id),
    status: kitchenTicketStatusEnum('status').notNull().default('pending'),
    ticketNumber: integer('ticket_number').notNull(),
    notes: text('notes'),
    ...timestamps,
  },
  (table) => [
    index('kitchen_ticket_sucursal_status_idx').on(
      table.sucursalId,
      table.status
    ),
  ]
)

export const kitchenTicketItemModel = pgTable('kitchen_ticket_item', {
  id: uuid('id').primaryKey().defaultRandom(),
  ticketId: uuid('ticket_id')
    .notNull()
    .references(() => kitchenTicketModel.id, { onDelete: 'cascade' }),
  productId: uuid('product_id').references(() => productModel.id),
  productName: text('product_name').notNull(),
  quantity: numeric('quantity', { precision: 12, scale: 4 }).notNull(),
  stationId: uuid('station_id').references(() => kitchenStationModel.id),
  modificationsJson: jsonb('modifications_json'),
  status: kitchenItemStatusEnum('status').notNull().default('pending'),
  ...timestamps,
})

export const kitchenStationRelations = relations(
  kitchenStationModel,
  ({ one }) => ({
    organization: one(organizationModel, {
      fields: [kitchenStationModel.organizationId],
      references: [organizationModel.id],
    }),
    sucursal: one(sucursalModel, {
      fields: [kitchenStationModel.sucursalId],
      references: [sucursalModel.id],
    }),
  })
)

export const kitchenTicketRelations = relations(
  kitchenTicketModel,
  ({ one, many }) => ({
    organization: one(organizationModel, {
      fields: [kitchenTicketModel.organizationId],
      references: [organizationModel.id],
    }),
    sucursal: one(sucursalModel, {
      fields: [kitchenTicketModel.sucursalId],
      references: [sucursalModel.id],
    }),
    sale: one(posSaleModel, {
      fields: [kitchenTicketModel.saleId],
      references: [posSaleModel.id],
    }),
    items: many(kitchenTicketItemModel),
  })
)

export const kitchenTicketItemRelations = relations(
  kitchenTicketItemModel,
  ({ one }) => ({
    ticket: one(kitchenTicketModel, {
      fields: [kitchenTicketItemModel.ticketId],
      references: [kitchenTicketModel.id],
    }),
    product: one(productModel, {
      fields: [kitchenTicketItemModel.productId],
      references: [productModel.id],
    }),
    station: one(kitchenStationModel, {
      fields: [kitchenTicketItemModel.stationId],
      references: [kitchenStationModel.id],
    }),
  })
)

export const selectKitchenStationSchema =
  createSelectSchema(kitchenStationModel)
export const insertKitchenStationSchema =
  createInsertSchema(kitchenStationModel)
export const selectKitchenTicketSchema = createSelectSchema(kitchenTicketModel)
export const insertKitchenTicketSchema = createInsertSchema(kitchenTicketModel)
export const selectKitchenTicketItemSchema = createSelectSchema(
  kitchenTicketItemModel
)
export const insertKitchenTicketItemSchema = createInsertSchema(
  kitchenTicketItemModel
)

export type KitchenStation = z.infer<typeof selectKitchenStationSchema>
export type InsertKitchenStation = z.infer<typeof insertKitchenStationSchema>
export type KitchenTicket = z.infer<typeof selectKitchenTicketSchema>
export type InsertKitchenTicket = z.infer<typeof insertKitchenTicketSchema>
export type KitchenTicketItem = z.infer<typeof selectKitchenTicketItemSchema>
export type InsertKitchenTicketItem = z.infer<
  typeof insertKitchenTicketItemSchema
>
