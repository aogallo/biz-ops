import { createInsertSchema, createSelectSchema } from 'drizzle-zod'
import { z } from 'zod'
import { accountingAccountModel } from '~/server/db/schemas/accounting'

// Base schemas from Drizzle
export const insertAccountSchema = createInsertSchema(accountingAccountModel, {
  accountNumber: z
    .string()
    .min(1, 'Account number is required')
    .max(50, 'Account number must not exceed 50 characters'),
  name: z
    .string()
    .min(1, 'Account name is required')
    .max(200, 'Name must not exceed 200 characters'),
})

export const selectAccountSchema = createSelectSchema(accountingAccountModel)

// Create schema (omit id)
export const createAccountSchema = insertAccountSchema.omit({
  id: true,
})

// Update schema (all fields optional except id)
export const updateAccountSchema = insertAccountSchema
  .partial()
  .required({ id: true })

// CSV row schema for bulk import
export const csvAccountRowSchema = z.object({
  accountNumber: z.string().min(1, 'Account number is required'),
  name: z.string().min(1, 'Account name is required'),
})

// Type exports
export type CreateAccountInput = z.infer<typeof createAccountSchema>
export type UpdateAccountInput = z.infer<typeof updateAccountSchema>
export type Account = z.infer<typeof selectAccountSchema>
export type CsvAccountRow = z.infer<typeof csvAccountRowSchema>
