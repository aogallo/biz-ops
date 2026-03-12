import { z } from 'zod'
import {
  insertOrganizationAccountingConfigSchema,
  selectOrganizationAccountingConfigSchema,
} from '~/server/db/schemas/organizationConfig'

// Base schemas from drizzle-zod
export { selectOrganizationAccountingConfigSchema }

// Update schema for accounting config form
export const updateAccountingConfigSchema =
  insertOrganizationAccountingConfigSchema
    .pick({
      ivaCreditoFiscalAccountId: true,
      ivaDebitoFiscalAccountId: true,
      accountsReceivableAccountId: true,
      accountsPayableAccountId: true,
      defaultSalesAccountId: true,
      defaultPurchaseAccountId: true,
      journalEntryPrefix: true,
      posCashAccountId: true,
      posCardAccountId: true,
      posCheckAccountId: true,
    })
    .extend({
      journalEntryPrefix: z
        .string()
        .min(1, 'Prefix is required')
        .max(10, 'Prefix must be 10 characters or less')
        .optional(),
    })

export type UpdateAccountingConfigInput = z.infer<
  typeof updateAccountingConfigSchema
>
