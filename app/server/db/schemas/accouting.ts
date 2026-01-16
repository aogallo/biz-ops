import { pgTable, text, uuid } from 'drizzle-orm/pg-core'
import { organizationModel } from './auth'

export const accountingAccount = pgTable('accounting_account', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id')
    .notNull()
    .references(() => organizationModel.id),
  name: text('name'),
  accountNumber: text('account_number'),
})
