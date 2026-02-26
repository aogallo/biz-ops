import { eq, and } from 'drizzle-orm'
import { db } from '~/server/db'
import { posSessionModel, posCashMovementModel } from '~/server/db/schemas/pos'
import type { OpenSessionInput } from '../../schemas'

export async function openSessionAction(input: OpenSessionInput) {
  return await db.transaction(async (tx) => {
    // Check no open session on this terminal
    const [existing] = await tx
      .select({ id: posSessionModel.id })
      .from(posSessionModel)
      .where(
        and(
          eq(posSessionModel.terminalId, input.terminalId),
          eq(posSessionModel.status, 'open')
        )
      )
      .limit(1)

    if (existing) {
      throw new Error('Terminal already has an open session')
    }

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
