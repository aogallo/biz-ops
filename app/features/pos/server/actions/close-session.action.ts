import { eq, and, sql } from 'drizzle-orm'
import { db } from '~/server/db'
import {
  posSessionModel,
  posCashMovementModel,
  posZReportModel,
  posSaleModel,
  posPaymentModel,
  posTerminalModel,
  posCashierModel,
} from '~/server/db/schemas/pos'
import { sucursalModel } from '~/server/db/schemas/sucursal'
import type { CloseSessionInput } from '../../schemas'
import { createPosSessionJournalEntry } from './create-pos-journal-entry.action'

export async function closeSessionAction(input: CloseSessionInput) {
  const txResult = await db.transaction(async (tx) => {
    // Get session
    const [session] = await tx
      .select()
      .from(posSessionModel)
      .where(
        and(
          eq(posSessionModel.id, input.sessionId),
          eq(posSessionModel.status, 'open')
        )
      )
      .limit(1)

    if (!session) {
      throw new Error('Session not found or already closed')
    }

    // Get terminal and cashier names for Z-Report
    const [terminal] = await tx
      .select({ name: posTerminalModel.name })
      .from(posTerminalModel)
      .where(eq(posTerminalModel.id, session.terminalId))
      .limit(1)

    const [cashier] = await tx
      .select({ name: posCashierModel.name })
      .from(posCashierModel)
      .where(eq(posCashierModel.id, session.cashierId))
      .limit(1)

    // Calculate totals from cash movements
    const movements = await tx
      .select()
      .from(posCashMovementModel)
      .where(eq(posCashMovementModel.sessionId, session.id))

    let totalDeposits = 0
    let totalWithdrawals = 0
    let totalRefundMovements = 0

    for (const m of movements) {
      const amt = Number(m.amount)
      switch (m.type) {
        case 'deposit':
          totalDeposits += amt
          break
        case 'withdrawal':
          totalWithdrawals += amt
          break
        case 'sale':
          break
        case 'refund':
          totalRefundMovements += amt
          break
      }
    }

    // Calculate sales totals from actual payment records
    const sales = await tx
      .select({
        id: posSaleModel.id,
        status: posSaleModel.status,
        total: posSaleModel.total,
        ivaAmount: posSaleModel.ivaAmount,
        createdAt: posSaleModel.createdAt,
      })
      .from(posSaleModel)
      .where(eq(posSaleModel.sessionId, session.id))

    let totalSales = 0
    let totalRefunds = 0
    let totalTax = 0
    let orderCount = 0
    let firstOrderTime: Date | null = null
    let lastOrderTime: Date | null = null

    for (const sale of sales) {
      if (sale.status === 'completed') {
        totalSales += Number(sale.total)
        totalTax += Number(sale.ivaAmount)
        orderCount++

        if (!firstOrderTime || sale.createdAt < firstOrderTime) {
          firstOrderTime = sale.createdAt
        }
        if (!lastOrderTime || sale.createdAt > lastOrderTime) {
          lastOrderTime = sale.createdAt
        }
      } else if (sale.status === 'voided') {
        totalRefunds += Number(sale.total)
      }
    }

    // Get payment breakdown by method
    const completedSaleIds = sales
      .filter((s) => s.status === 'completed')
      .map((s) => s.id)

    let totalCashSales = 0
    let totalCardSales = 0
    let totalCheckSales = 0

    if (completedSaleIds.length > 0) {
      const payments = await tx
        .select()
        .from(posPaymentModel)
        .where(sql`${posPaymentModel.saleId} IN ${completedSaleIds}`)

      for (const p of payments) {
        const amt = Number(p.amount)
        switch (p.method) {
          case 'cash':
            totalCashSales += amt
            break
          case 'card':
            totalCardSales += amt
            break
          case 'check':
            totalCheckSales += amt
            break
        }
      }
    }

    const openingCash = Number(session.openingCashAmount)
    const expectedCash =
      openingCash +
      totalCashSales -
      totalRefundMovements -
      totalWithdrawals +
      (totalDeposits - openingCash)
    const closingCash = input.closingCashAmount
    const cashDifference = closingCash - expectedCash
    const closedAt = new Date()

    // Update session
    await tx
      .update(posSessionModel)
      .set({
        status: 'closed',
        closedAt,
        closingCashAmount: String(closingCash),
        expectedCashAmount: String(expectedCash),
        notes: input.notes,
        updatedAt: new Date(),
      })
      .where(eq(posSessionModel.id, session.id))

    // Create Z-Report
    const [zReport] = await tx
      .insert(posZReportModel)
      .values({
        sessionId: session.id,
        organizationId: session.organizationId,
        terminalName: terminal?.name ?? 'Unknown',
        cashierName: cashier?.name ?? 'Unknown',
        openedAt: session.openedAt,
        closedAt,
        openingCash: String(openingCash),
        closingCash: String(closingCash),
        expectedCash: String(expectedCash),
        cashDifference: String(cashDifference),
        totalSales: String(totalSales),
        totalCashSales: String(totalCashSales),
        totalCardSales: String(totalCardSales),
        totalCheckSales: String(totalCheckSales),
        totalRefunds: String(totalRefunds),
        totalWithdrawals: String(totalWithdrawals),
        totalDeposits: String(totalDeposits - openingCash), // Exclude opening
        totalTax: String(totalTax),
        orderCount,
        firstOrderTime,
        lastOrderTime,
      })
      .returning()

    return {
      sessionId: session.id,
      zReportId: zReport.id,
      organizationId: session.organizationId,
      sucursalId: session.sucursalId,
    }
  })

  // Look up company from sucursal (needed for journal entry)
  let companyIdForJournal: string | null = null
  if (txResult.sucursalId) {
    const [sucursal] = await db
      .select({ companyId: sucursalModel.companyId })
      .from(sucursalModel)
      .where(eq(sucursalModel.id, txResult.sucursalId))
      .limit(1)
    companyIdForJournal = sucursal?.companyId ?? null
  }

  // Create journal entry outside the transaction (uses its own)
  let journalEntryId: string | undefined
  try {
    const jeResult = await createPosSessionJournalEntry(
      txResult.sessionId,
      txResult.organizationId,
      companyIdForJournal
    )
    journalEntryId = jeResult.journalEntryId
  } catch (error) {
    // Log but don't fail the session close
    console.error('Failed to create POS journal entry:', error)
  }

  return {
    sessionId: txResult.sessionId,
    zReportId: txResult.zReportId,
    journalEntryId,
  }
}
