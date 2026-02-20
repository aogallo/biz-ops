import { eq, and, sql } from 'drizzle-orm'
import { db } from '~/server/db'
import {
  posSaleModel,
  posSaleLineModel,
  posPaymentModel,
  posCashMovementModel,
  posSessionModel,
} from '~/server/db/schemas/pos'
import { productModel } from '~/server/db/schemas/products'
import { stockMovementModel } from '~/server/db/schemas/stockMovement'
import { invoiceModel } from '~/server/db/schemas/invoice'

export async function voidSaleAction(saleId: string, userId: string) {
  return await db.transaction(async (tx) => {
    // 1. Get sale
    const [sale] = await tx
      .select()
      .from(posSaleModel)
      .where(eq(posSaleModel.id, saleId))
      .limit(1)

    if (!sale) {
      throw new Error('Sale not found')
    }

    if (sale.status === 'voided') {
      throw new Error('Sale is already voided')
    }

    // 2. Get sale lines
    const lines = await tx
      .select()
      .from(posSaleLineModel)
      .where(eq(posSaleLineModel.saleId, saleId))

    // 3. Reverse stock for each line
    for (const line of lines) {
      // Check if the original product had a stock movement (STOCK type)
      const [originalMovement] = await tx
        .select()
        .from(stockMovementModel)
        .where(
          eq(stockMovementModel.referenceId, saleId)
        )
        .limit(1)

      // Only reverse stock if there was an exit movement
      if (originalMovement) {
        const qty = Number(line.quantity)

        await tx.insert(stockMovementModel).values({
          organizationId: sale.organizationId,
          productId: line.productId,
          type: 'entry',
          quantity: qty,
          reason: `Void POS Sale ${sale.saleNumber}`,
          referenceType: 'pos_sale_void',
          referenceId: saleId,
          createdById: userId,
        })

        await tx
          .update(productModel)
          .set({
            stock: sql`${productModel.stock} + ${qty}`,
            updatedAt: new Date(),
          })
          .where(eq(productModel.id, line.productId))
      }
    }

    // 4. Void linked invoice if exists
    if (sale.invoiceId) {
      await tx
        .update(invoiceModel)
        .set({ status: 'voided', updatedAt: new Date() })
        .where(eq(invoiceModel.id, sale.invoiceId))
    }

    // 5. Create refund cash movement if sale has open session
    if (sale.sessionId) {
      const [session] = await tx
        .select({ id: posSessionModel.id, status: posSessionModel.status })
        .from(posSessionModel)
        .where(
          and(
            eq(posSessionModel.id, sale.sessionId),
            eq(posSessionModel.status, 'open')
          )
        )
        .limit(1)

      if (session) {
        // Calculate cash payment total for this sale
        const payments = await tx
          .select()
          .from(posPaymentModel)
          .where(eq(posPaymentModel.saleId, saleId))

        const cashTotal = payments
          .filter((p) => p.method === 'cash')
          .reduce((sum, p) => sum + Number(p.amount), 0)

        if (cashTotal > 0) {
          await tx.insert(posCashMovementModel).values({
            sessionId: sale.sessionId,
            type: 'refund',
            amount: String(cashTotal),
            referenceId: saleId,
            notes: `Void Sale ${sale.saleNumber}`,
          })
        }
      }
    }

    // 6. Mark sale as voided
    const [voidedSale] = await tx
      .update(posSaleModel)
      .set({ status: 'voided', updatedAt: new Date() })
      .where(eq(posSaleModel.id, saleId))
      .returning()

    return voidedSale
  })
}
