import { posRepository } from '../repository'
import { closeSessionAction } from './close-session.action'
import { isStaleSession } from '../utils/session-date'

type AutoCloseResult = { closed: true; zReportId: string } | { closed: false }

export async function autoCloseStaleSessionAction(
  sessionId: string
): Promise<AutoCloseResult> {
  const session = await posRepository.getSessionById(sessionId)
  if (!session || session.status !== 'open') return { closed: false }
  if (!isStaleSession(session.openedAt)) return { closed: false }

  const expectedCash =
    await posRepository.calculateExpectedCashForSession(sessionId)
  const closedDate = new Date().toLocaleDateString('es-GT')

  const result = await closeSessionAction({
    sessionId,
    closingCashAmount: expectedCash,
    notes: `[AUTO-CIERRE] Turno cerrado automáticamente por cruce de día. Cierre realizado el ${closedDate}.`,
  })

  return { closed: true, zReportId: result.zReportId }
}
