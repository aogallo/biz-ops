import { boolean, date, pgTable, real, text, uuid } from 'drizzle-orm/pg-core'
import {
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema,
} from 'drizzle-zod'
import type z from 'zod'
import { accountingAccountModel } from './accounting'
import { businessPartnerModel } from './businessPartner'
import { companyModel } from './company'

export const satFileModel = pgTable('sat_file', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyId: uuid('company_id')
    .notNull()
    .references(() => companyModel.id),
  businessPartnerId: uuid('business_partner_id')
    .notNull()
    .references(() => businessPartnerModel.id),
  accountingAccountId: uuid('accounting_account_id').references(
    () => accountingAccountModel.id
  ),
  date: date('date').notNull(),
  authorizationNumber: text('authorization_number').notNull(),
  dteType: text('dte_type').notNull(),
  serie: text('serie').notNull(),
  dteNumber: text('dte_number').notNull(),
  exportation: boolean('exportation').default(false),
  certificatorNit: text('certificator_nit'),
  certificatorName: text('certificator_name'),
  state: text('state').notNull(),
  money: text('state').notNull(),
  total: real('total').notNull(),
  iva: real('iva').notNull(),
  isVoided: boolean('is_voided').default(false),
  voidedDate: date('voided_date').notNull(),
  petroleum: real('petroleum').default(0.0),
  hotel: real('hotel').default(0.0),
  tickets: real('tickets').default(0.0),
  //Timbre de Prensa
  pressStamp: real('press_stamp').default(0.0),
  firefigthers: real('firefigthers').default(0.0),
  municipalTax: real('municipal_tax').default(0.0),
  alcoholicTax: real('alcoholic_tax').default(0.0),
  tobacco_tax: real('tobacco_tax').default(0.0),
  cementTax: real('cement_tax').default(0.0),
  noAlcoholicTax: real('no_alcoholic_tax').default(0.0),
  portTariffTax: real('port_tariff_tax').default(0.0),
})

export const selectSatFileSchema = createSelectSchema(satFileModel)
export const insertSatFileSchema = createInsertSchema(satFileModel)
export const updateSatFileSchema = createUpdateSchema(satFileModel)

export type SatFile = z.infer<typeof selectSatFileSchema>
