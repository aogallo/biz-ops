import { relations } from 'drizzle-orm'
import {
  boolean,
  integer,
  numeric,
  pgEnum,
  pgTable,
  text,
  uuid,
} from 'drizzle-orm/pg-core'
import { organizationModel } from './auth'
import { timestamps } from './common'

// Service color enum
export const serviceColorEnum = pgEnum('service_color', [
  'blue',
  'green',
  'orange',
  'teal',
  'purple',
  'red',
  'yellow',
])

// Service model
export const serviceModel = pgTable('service', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id')
    .notNull()
    .references(() => organizationModel.id),
  name: text('name').notNull(),
  duration: integer('duration').notNull(), // in minutes
  color: serviceColorEnum('color').notNull().default('blue'),
  price: numeric('price', { precision: 12, scale: 2 }),
  description: text('description'),
  isActive: boolean('is_active').notNull().default(true),
  ...timestamps,
})

// Relations
export const serviceRelations = relations(serviceModel, ({ one }) => ({
  organization: one(organizationModel, {
    fields: [serviceModel.organizationId],
    references: [organizationModel.id],
  }),
}))
