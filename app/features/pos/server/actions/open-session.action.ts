import { eq, and } from 'drizzle-orm'
import { db } from '~/server/db'
import { posSessionModel, posCashMovementModel } from '~/server/db/schemas/pos'
import type { OpenSessionInput } from '../../schemas'
import { autoCloseStaleSessionAction } from './auto-close-stale-session.action'

export async function openSessionAction(input: OpenSessionInput) {
  // Check for existing open session before entering the transaction to avoid
  // nested transactions (not supported with Neon HTTP driver).
  const [preCheck] = await db
    .select({ id: posSessionModel.id })
    .from(posSessionModel)
    .where(
      and(
        eq(posSessionModel.terminalId, input.terminalId),
        eq(posSessionModel.status, 'open')
      )
    )
    .limit(1)

  if (preCheck) {
    const staleResult = await autoCloseStaleSessionAction(preCheck.id)
    if (!staleResult.closed) {
      throw new Error('Terminal already has an open session')
    }
    // stale session auto-closed — proceed to create new session
  }

  return await db.transaction(async (tx) => {
    // Create session
    const [session] = await tx
      .insert(posSessionModel)
      .values({
        organizationId: input.organizationId,
        sucursalId: input.sucursalId,
        terminalId: input.terminalId,
        cashierId: input.cashierId,
        openingCashAmount: String(input.openingCashAmount),
        status: 'open',
      })
      .returning()

    // Create opening deposit cash movement
    await tx.insert(posCashMovementModel).values({
      sessionId: session.id,
      type: 'deposit',
      amount: String(input.openingCashAmount),
      notes: 'Opening cash',
    })

    return session
  })
}
