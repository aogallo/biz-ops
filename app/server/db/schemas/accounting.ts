import { pgTable, text, uuid } from 'drizzle-orm/pg-core'
import { createSelectSchema } from 'drizzle-zod'
import type z from 'zod'
import { organizationModel } from './auth'

export const accountingAccountModel = pgTable('accounting_account', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id')
    .notNull()
    .references(() => organizationModel.id),
  name: text('name'),
  accountNumber: text('account_number'),
})

export const selectAccountingAccountSchema = createSelectSchema(
  accountingAccountModel
)

export type AccountingAccount = z.infer<typeof selectAccountingAccountSchema>
