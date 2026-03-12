import { eq } from 'drizzle-orm'
import { db } from '~/server/db'
import { posSaleModel, posPaymentModel } from '~/server/db/schemas/pos'
import { posTablesRepository } from '~/features/pos/server/repository/tables.repository'
import type { PosPaymentMethod } from '~/server/db/schemas/pos'

export interface CloseTablePayment {
  method: PosPaymentMethod
  amount: string
  receivedAmount?: string
  changeAmount?: string
  exchangeRate?: string
  reference?: string
}

export interface CloseTableOrderInput {
  tableId: string
  saleNumber: string
  payments: CloseTablePayment[]
  subtotal: string
  ivaAmount: string
  discountAmount?: string
  total: string
  notes?: string
}

export async function closeTableOrderAction(input: CloseTableOrderInput) {
  const openSale = await posTablesRepository.getActiveOrderForTable(
    input.tableId
  )
  if (!openSale) throw new Error('No open order found for this table')

  const sale = await db.transaction(async (tx) => {
    const [closedSale] = await tx
      .update(posSaleModel)
      .set({
        status: 'completed',
        saleNumber: input.saleNumber,
        subtotal: input.subtotal,
        ivaAmount: input.ivaAmount,
        discountAmount: input.discountAmount ?? '0',
        total: input.total,
        notes: input.notes,
      })
      .where(eq(posSaleModel.id, openSale.id))
      .returning()

    await tx.insert(posPaymentModel).values(
      input.payments.map((p) => ({
        saleId: openSale.id,
        method: p.method,
        amount: p.amount,
        receivedAmount: p.receivedAmount,
        changeAmount: p.changeAmount,
        exchangeRate: p.exchangeRate,
        reference: p.reference,
      }))
    )

    return closedSale
  })

  await posTablesRepository.updateTableStatus(input.tableId, 'available')

  return sale
}
