import { eq, and } from 'drizzle-orm'
import { db } from '~/server/db'
import { posSessionModel, posCashMovementModel } from '~/server/db/schemas/pos'
import type { CashMovementInput } from '../../schemas'

export async function cashMovementAction(input: CashMovementInput) {
  // Validate session is open
  const [session] = await db
    .select({ id: posSessionModel.id, status: posSessionModel.status })
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

  const [movement] = await db
    .insert(posCashMovementModel)
    .values({
      sessionId: input.sessionId,
      type: input.type,
      amount: String(input.amount),
      notes: input.notes,
    })
    .returning()

  return movement
}
