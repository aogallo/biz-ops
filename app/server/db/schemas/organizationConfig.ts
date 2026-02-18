import { relations } from 'drizzle-orm'
import { integer, pgTable, text, uuid } from 'drizzle-orm/pg-core'
import {
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema,
} from 'drizzle-zod'
import type { z } from 'zod'
import { accountingAccountModel } from './accounting'
import { organizationModel } from './auth'
import { timestamps } from './common'

// Organization Accounting Config Model
export const organizationAccountingConfigModel = pgTable(
  'organization_accounting_config',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .notNull()
      .unique()
      .references(() => organizationModel.id),
    // IVA accounts
    ivaCreditoFiscalAccountId: uuid('iva_credito_fiscal_account_id').references(
      () => accountingAccountModel.id
    ),
    ivaDebitoFiscalAccountId: uuid('iva_debito_fiscal_account_id').references(
      () => accountingAccountModel.id
    ),
    // Receivable/Payable accounts
    accountsReceivableAccountId: uuid(
      'accounts_receivable_account_id'
    ).references(() => accountingAccountModel.id),
    accountsPayableAccountId: uuid('accounts_payable_account_id').references(
      () => accountingAccountModel.id
    ),
    // Default accounts for revenue/expense
    defaultSalesAccountId: uuid('default_sales_account_id').references(
      () => accountingAccountModel.id
    ),
    defaultPurchaseAccountId: uuid('default_purchase_account_id').references(
      () => accountingAccountModel.id
    ),
    // Journal entry settings
    journalEntryPrefix: text('journal_entry_prefix').notNull().default('JE'),
    nextJournalEntryNumber: integer('next_journal_entry_number')
      .notNull()
      .default(1),
    // Manual invoice settings
    manualInvoicePrefix: text('manual_invoice_prefix').notNull().default('M'),
    nextManualInvoiceNumber: integer('next_manual_invoice_number')
      .notNull()
      .default(1),
    // Order settings
    orderPrefix: text('order_prefix').notNull().default('OR'),
    nextOrderNumber: integer('next_order_number').notNull().default(1),
    ...timestamps,
  }
)

// Relations
export const organizationAccountingConfigRelations = relations(
  organizationAccountingConfigModel,
  ({ one }) => ({
    organization: one(organizationModel, {
      fields: [organizationAccountingConfigModel.organizationId],
      references: [organizationModel.id],
    }),
    ivaCreditoFiscalAccount: one(accountingAccountModel, {
      fields: [organizationAccountingConfigModel.ivaCreditoFiscalAccountId],
      references: [accountingAccountModel.id],
      relationName: 'ivaCreditoFiscal',
    }),
    ivaDebitoFiscalAccount: one(accountingAccountModel, {
      fields: [organizationAccountingConfigModel.ivaDebitoFiscalAccountId],
      references: [accountingAccountModel.id],
      relationName: 'ivaDebitoFiscal',
    }),
    accountsReceivableAccount: one(accountingAccountModel, {
      fields: [organizationAccountingConfigModel.accountsReceivableAccountId],
      references: [accountingAccountModel.id],
      relationName: 'accountsReceivable',
    }),
    accountsPayableAccount: one(accountingAccountModel, {
      fields: [organizationAccountingConfigModel.accountsPayableAccountId],
      references: [accountingAccountModel.id],
      relationName: 'accountsPayable',
    }),
    defaultSalesAccount: one(accountingAccountModel, {
      fields: [organizationAccountingConfigModel.defaultSalesAccountId],
      references: [accountingAccountModel.id],
      relationName: 'defaultSales',
    }),
    defaultPurchaseAccount: one(accountingAccountModel, {
      fields: [organizationAccountingConfigModel.defaultPurchaseAccountId],
      references: [accountingAccountModel.id],
      relationName: 'defaultPurchase',
    }),
  })
)

// Schemas
export const selectOrganizationAccountingConfigSchema = createSelectSchema(
  organizationAccountingConfigModel
)
export const insertOrganizationAccountingConfigSchema = createInsertSchema(
  organizationAccountingConfigModel
)
export const updateOrganizationAccountingConfigSchema = createUpdateSchema(
  organizationAccountingConfigModel
)

// Types
export type OrganizationAccountingConfig = z.infer<
  typeof selectOrganizationAccountingConfigSchema
>
export type InsertOrganizationAccountingConfig = z.infer<
  typeof insertOrganizationAccountingConfigSchema
>
export type UpdateOrganizationAccountingConfig = z.infer<
  typeof updateOrganizationAccountingConfigSchema
>
