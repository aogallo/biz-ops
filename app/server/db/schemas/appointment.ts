import { relations } from 'drizzle-orm'
import {
  date,
  pgEnum,
  pgTable,
  text,
  time,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core'
import { organizationModel, memberModel } from './auth'
import { businessPartnerModel } from './businessPartner'
import { serviceModel } from './service'
import { timestamps } from './common'

// Appointment status enum
export const appointmentStatusEnum = pgEnum('appointment_status', [
  'pending',
  'confirmed',
  'cancelled',
  'completed',
])

// Appointment model
export const appointmentModel = pgTable('appointment', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id')
    .notNull()
    .references(() => organizationModel.id),
  clientId: uuid('client_id')
    .notNull()
    .references(() => businessPartnerModel.id),
  serviceId: uuid('service_id')
    .notNull()
    .references(() => serviceModel.id),
  staffId: uuid('staff_id')
    .notNull()
    .references(() => memberModel.id),
  date: date('date').notNull(),
  startTime: time('start_time').notNull(),
  endTime: time('end_time').notNull(),
  status: appointmentStatusEnum('status').notNull().default('pending'),
  notes: text('notes'),
  reminderSentAt: timestamp('reminder_sent_at'),
  ...timestamps,
})

// Relations
export const appointmentRelations = relations(appointmentModel, ({ one }) => ({
  organization: one(organizationModel, {
    fields: [appointmentModel.organizationId],
    references: [organizationModel.id],
  }),
  client: one(businessPartnerModel, {
    fields: [appointmentModel.clientId],
    references: [businessPartnerModel.id],
  }),
  service: one(serviceModel, {
    fields: [appointmentModel.serviceId],
    references: [serviceModel.id],
  }),
  staff: one(memberModel, {
    fields: [appointmentModel.staffId],
    references: [memberModel.id],
  }),
}))
