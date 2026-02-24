import { pgTable, text, uniqueIndex, uuid } from 'drizzle-orm/pg-core'
import { createSelectSchema } from 'drizzle-zod'
import { organizationModel } from './auth'
import { timestamps } from './common'

// Companies (Legal entities under one Organization)
export const companyModel = pgTable(
  'company',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizationModel.id),
    name: text('name').notNull(),
    nit: text('nit').notNull(),
    email: text('email'),
    taxId: text('tax_id'),
    code: text('code'),
    ...timestamps,
  },
  (table) => [
    uniqueIndex('company_code_org_idx').on(table.organizationId, table.code),
  ]
)

export const selectCompanySchema = createSelectSchema(companyModel)
