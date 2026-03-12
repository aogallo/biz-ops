import { relations } from 'drizzle-orm'
import {
  integer,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core'
import {
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema,
} from 'drizzle-zod'
import type { z } from 'zod'
import { accountingAccountModel } from './accounting'
import { organizationModel, userModel } from './auth'
import { companyModel } from './company'
import { timestamps } from './common'
import { invoiceModel, invoiceLineModel } from './invoice'
import { posSessionModel } from './pos'
import { satFileModel } from './sat-file'

// Enums
export const journalEntrySourceEnum = pgEnum('journal_entry_source', [
  'manual',
  'invoice',
  'adjustment',
  'pos',
])

export const journalEntryStatusEnum = pgEnum('journal_entry_status', [
  'draft',
  'posted',
  'voided',
])

// Journal Entry Model
export const journalEntryModel = pgTable('journal_entry', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id')
    .notNull()
    .references(() => organizationModel.id),
  companyId: uuid('company_id')
    .notNull()
    .references(() => companyModel.id),
  entryNumber: text('entry_number').notNull(),
  description: text('description').notNull(),
  entryDate: timestamp('entry_date').notNull(),
  notes: text('notes'),
  source: journalEntrySourceEnum('source').notNull().default('manual'),
  sourceInvoiceId: uuid('source_invoice_id').references(() => invoiceModel.id),
  sourceSatFileId: uuid('source_sat_file_id').references(() => satFileModel.id),
  sourcePosSessionId: uuid('source_pos_session_id'),
  totalDebit: numeric('total_debit', { precision: 12, scale: 2 })
    .notNull()
    .default('0'),
  totalCredit: numeric('total_credit', { precision: 12, scale: 2 })
    .notNull()
    .default('0'),
  status: journalEntryStatusEnum('status').notNull().default('draft'),
  postedAt: timestamp('posted_at'),
  postedBy: uuid('posted_by').references(() => userModel.id),
  ...timestamps,
})

// Journal Entry Line Model
export const journalEntryLineModel = pgTable('journal_entry_line', {
  id: uuid('id').primaryKey().defaultRandom(),
  journalEntryId: uuid('journal_entry_id')
    .notNull()
    .references(() => journalEntryModel.id, { onDelete: 'cascade' }),
  lineNumber: integer('line_number').notNull(),
  accountingAccountId: uuid('accounting_account_id')
    .notNull()
    .references(() => accountingAccountModel.id),
  description: text('description'),
  debitAmount: numeric('debit_amount', { precision: 12, scale: 2 })
    .notNull()
    .default('0'),
  creditAmount: numeric('credit_amount', { precision: 12, scale: 2 })
    .notNull()
    .default('0'),
  invoiceLineId: uuid('invoice_line_id').references(() => invoiceLineModel.id),
  ...timestamps,
})

// Relations
export const journalEntryRelations = relations(
  journalEntryModel,
  ({ one, many }) => ({
    organization: one(organizationModel, {
      fields: [journalEntryModel.organizationId],
      references: [organizationModel.id],
    }),
    company: one(companyModel, {
      fields: [journalEntryModel.companyId],
      references: [companyModel.id],
    }),
    sourceInvoice: one(invoiceModel, {
      fields: [journalEntryModel.sourceInvoiceId],
      references: [invoiceModel.id],
    }),
    sourceSatFile: one(satFileModel, {
      fields: [journalEntryModel.sourceSatFileId],
      references: [satFileModel.id],
    }),
    sourcePosSession: one(posSessionModel, {
      fields: [journalEntryModel.sourcePosSessionId],
      references: [posSessionModel.id],
    }),
    postedByUser: one(userModel, {
      fields: [journalEntryModel.postedBy],
      references: [userModel.id],
    }),
    lines: many(journalEntryLineModel),
  })
)

export const journalEntryLineRelations = relations(
  journalEntryLineModel,
  ({ one }) => ({
    journalEntry: one(journalEntryModel, {
      fields: [journalEntryLineModel.journalEntryId],
      references: [journalEntryModel.id],
    }),
    accountingAccount: one(accountingAccountModel, {
      fields: [journalEntryLineModel.accountingAccountId],
      references: [accountingAccountModel.id],
    }),
    invoiceLine: one(invoiceLineModel, {
      fields: [journalEntryLineModel.invoiceLineId],
      references: [invoiceLineModel.id],
    }),
  })
)

// Schemas
export const selectJournalEntrySchema = createSelectSchema(journalEntryModel)
export const insertJournalEntrySchema = createInsertSchema(journalEntryModel)
export const updateJournalEntrySchema = createUpdateSchema(journalEntryModel)

export const selectJournalEntryLineSchema = createSelectSchema(
  journalEntryLineModel
)
export const insertJournalEntryLineSchema = createInsertSchema(
  journalEntryLineModel
)
export const updateJournalEntryLineSchema = createUpdateSchema(
  journalEntryLineModel
)

// Types
export type JournalEntry = z.infer<typeof selectJournalEntrySchema>
export type InsertJournalEntry = z.infer<typeof insertJournalEntrySchema>
export type JournalEntryLine = z.infer<typeof selectJournalEntryLineSchema>
export type InsertJournalEntryLine = z.infer<
  typeof insertJournalEntryLineSchema
>
export type JournalEntrySource = 'manual' | 'invoice' | 'adjustment' | 'pos'
export type JournalEntryStatus = 'draft' | 'posted' | 'voided'
