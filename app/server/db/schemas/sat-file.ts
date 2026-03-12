import {
  boolean,
  date,
  pgTable,
  real,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'
import {
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema,
} from 'drizzle-zod'
import type z from 'zod'
import { accountingAccountModel } from './accounting'
import { organizationModel } from './auth'
import { businessPartnerModel } from './businessPartner'
import { companyModel } from './company'
import { timestamps } from './common'

export const satFileModel = pgTable(
  'sat_file',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizationModel.id),
    companyId: uuid('company_id')
      .notNull()
      .references(() => companyModel.id),
    invoiceType: text('invoice_type').notNull(), // 'purchase' | 'sales'
    businessPartnerId: uuid('business_partner_id').references(
      () => businessPartnerModel.id
    ),
    accountingAccountId: uuid('accounting_account_id').references(
      () => accountingAccountModel.id
    ),
    date: date('date').notNull(),
    authorizationNumber: text('authorization_number').notNull(),
    dteType: text('dte_type').notNull(),
    serie: text('serie').notNull(),
    dteNumber: text('dte_number').notNull(),
    emitterNit: text('emitter_nit'),
    emitterName: text('emitter_name'),
    receptorNit: text('receptor_nit'),
    receptorName: text('receptor_name'),
    exportation: boolean('exportation').default(false),
    certificatorNit: text('certificator_nit'),
    certificatorName: text('certificator_name'),
    state: text('state').notNull(),
    money: text('money').notNull(),
    total: real('total').notNull(),
    iva: real('iva').notNull(),
    isVoided: boolean('is_voided').default(false),
    voidedDate: date('voided_date'),
    petroleum: real('petroleum').default(0.0),
    hotel: real('hotel').default(0.0),
    tickets: real('tickets').default(0.0),
    pressStamp: real('press_stamp').default(0.0),
    firefighters: real('firefighters').default(0.0),
    municipalTax: real('municipal_tax').default(0.0),
    alcoholicTax: real('alcoholic_tax').default(0.0),
    tobaccoTax: real('tobacco_tax').default(0.0),
    cementTax: real('cement_tax').default(0.0),
    noAlcoholicTax: real('no_alcoholic_tax').default(0.0),
    portTariffTax: real('port_tariff_tax').default(0.0),
    itemType: text('item_type'), // 'goods' | 'services' | null
    // Processing fields
    processedAt: timestamp('processed_at'),
    invoiceId: uuid('invoice_id'), // FK to invoice, set when journal entry is created
    journalEntryId: uuid('journal_entry_id'), // FK to journal entry
    ...timestamps,
  },
  (table) => [
    uniqueIndex('sat_file_unique_dte_idx').on(
      table.organizationId,
      table.companyId,
      table.date,
      table.authorizationNumber,
      table.dteType,
      table.serie,
      table.dteNumber
    ),
  ]
)

export const selectSatFileSchema = createSelectSchema(satFileModel)
export const insertSatFileSchema = createInsertSchema(satFileModel)
export const updateSatFileSchema = createUpdateSchema(satFileModel)

export type SatFile = z.infer<typeof selectSatFileSchema>
