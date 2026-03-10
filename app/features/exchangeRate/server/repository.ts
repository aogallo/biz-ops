import { and, eq } from 'drizzle-orm'
import { db } from '~/server/db'
import { exchangeRateModel } from '~/server/db/schemas/exchangeRate'
import type { SetExchangeRateInput } from '../schemas'

export class ExchangeRateRepository {
  async getActiveRate(
    organizationId: string,
    fromCurrency: string,
    toCurrency: string
  ) {
    const [rate] = await db
      .select()
      .from(exchangeRateModel)
      .where(
        and(
          eq(exchangeRateModel.organizationId, organizationId),
          eq(exchangeRateModel.fromCurrency, fromCurrency),
          eq(exchangeRateModel.toCurrency, toCurrency),
          eq(exchangeRateModel.isActive, true)
        )
      )
      .limit(1)
    return rate ?? null
  }

  async setRate(data: SetExchangeRateInput) {
    return await db.transaction(async (tx) => {
      // Deactivate previous active rates for this currency pair
      await tx
        .update(exchangeRateModel)
        .set({ isActive: false, updatedAt: new Date() })
        .where(
          and(
            eq(exchangeRateModel.organizationId, data.organizationId),
            eq(exchangeRateModel.fromCurrency, data.fromCurrency),
            eq(exchangeRateModel.toCurrency, data.toCurrency),
            eq(exchangeRateModel.isActive, true)
          )
        )

      // Insert new active rate
      const [rate] = await tx
        .insert(exchangeRateModel)
        .values({
          organizationId: data.organizationId,
          fromCurrency: data.fromCurrency,
          toCurrency: data.toCurrency,
          rate: String(data.rate),
          effectiveDate: data.effectiveDate,
          isActive: true,
          createdBy: data.createdBy ?? null,
        })
        .returning()

      return rate
    })
  }

  async getRateHistory(
    organizationId: string,
    fromCurrency: string,
    toCurrency: string
  ) {
    return await db
      .select()
      .from(exchangeRateModel)
      .where(
        and(
          eq(exchangeRateModel.organizationId, organizationId),
          eq(exchangeRateModel.fromCurrency, fromCurrency),
          eq(exchangeRateModel.toCurrency, toCurrency)
        )
      )
      .orderBy(exchangeRateModel.effectiveDate)
  }
}

export const exchangeRateRepository = new ExchangeRateRepository()
