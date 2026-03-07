import type { ReceiptData } from '../types'
import { buildEscPos } from './escpos-builder'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type T = (key: any, params?: any) => string

export type QzPrintResult = { success: true } | { success: false; reason: string }

export async function printWithQz(
  receipt: ReceiptData,
  t: T
): Promise<QzPrintResult> {
  if (typeof window === 'undefined') {
    return { success: false, reason: 'Not in browser environment' }
  }

  if (!receipt.printerName) {
    return { success: false, reason: 'No printer name configured for this terminal' }
  }

  let qz: typeof import('qz-tray')
  try {
    qz = await import('qz-tray')
  } catch (e) {
    return { success: false, reason: `Failed to load qz-tray: ${String(e)}` }
  }

  const wasActive = qz.websocket.isActive()

  try {
    if (!wasActive) {
      await qz.websocket.connect({ retries: 2, delay: 1 })
    }

    const config = qz.configs.create(receipt.printerName)
    await qz.print(config, [
      { type: 'raw', format: 'command', flavor: 'plain', data: buildEscPos(receipt, t) },
    ])

    return { success: true }
  } catch (e) {
    return { success: false, reason: String(e) }
  } finally {
    if (!wasActive && qz.websocket.isActive()) {
      try {
        await qz.websocket.disconnect()
      } catch {
        // ignore disconnect errors
      }
    }
  }
}
