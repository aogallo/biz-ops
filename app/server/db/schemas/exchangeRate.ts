import { relations } from 'drizzle-orm'
import {
  boolean,
  date,
  index,
  numeric,
  pgTable,
  text,
  uuid,
} from 'drizzle-orm/pg-core'
import {
  createInsertSchema,
  createSelectSchema,
} from 'drizzle-zod'
import type { z } from 'zod'
import { organizationModel, userModel } from './auth'
import { timestamps } from './common'

export const exchangeRateModel = pgTable(
  'exchange_rate',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizationModel.id),
    fromCurrency: text('from_currency').notNull(),
    toCurrency: text('to_currency').notNull(),
    rate: numeric('rate', { precision: 10, scale: 4 }).notNull(),
    effectiveDate: date('effective_date').notNull(),
    isActive: boolean('is_active').notNull().default(true),
    createdBy: uuid('created_by').references(() => userModel.id),
    ...timestamps,
  },
  (table) => [
    index('exchange_rate_org_currencies_active_idx').on(
      table.organizationId,
      table.fromCurrency,
      table.toCurrency,
      table.isActive
    ),
  ]
)

export const exchangeRateRelations = relations(
  exchangeRateModel,
  ({ one }) => ({
    organization: one(organizationModel, {
      fields: [exchangeRateModel.organizationId],
      references: [organizationModel.id],
    }),
    createdByUser: one(userModel, {
      fields: [exchangeRateModel.createdBy],
      references: [userModel.id],
    }),
  })
)

export const selectExchangeRateSchema = createSelectSchema(exchangeRateModel)
export const insertExchangeRateSchema = createInsertSchema(exchangeRateModel)

export type ExchangeRate = z.infer<typeof selectExchangeRateSchema>
export type InsertExchangeRate = z.infer<typeof insertExchangeRateSchema>
