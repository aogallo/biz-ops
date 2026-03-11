import { createInsertSchema, createSelectSchema } from 'drizzle-zod'
import { z } from 'zod'
import { exchangeRateModel } from '~/server/db/schemas/exchangeRate'

export const insertExchangeRateSchema = createInsertSchema(exchangeRateModel)
export const selectExchangeRateSchema = createSelectSchema(exchangeRateModel)

export const setExchangeRateSchema = z.object({
  organizationId: z.string().uuid(),
  fromCurrency: z.string().min(1).max(10),
  toCurrency: z.string().min(1).max(10),
  rate: z.number().positive('Rate must be positive'),
  effectiveDate: z.string(), // ISO date string
  createdBy: z.string().uuid().optional().nullable(),
})

export type SetExchangeRateInput = z.infer<typeof setExchangeRateSchema>
