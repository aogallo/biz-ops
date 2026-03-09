import type { ReceiptData } from '../types'
import { buildEscPos } from './escpos-builder'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type T = (key: any, params?: any) => string

export type QzPrintResult =
  | { success: true }
  | { success: false; reason: string }

export async function printWithQz(
  receipt: ReceiptData,
  t: T
): Promise<QzPrintResult> {
  if (typeof window === 'undefined') {
    return { success: false, reason: 'Not in browser environment' }
  }

  if (!receipt.printerName) {
    return {
      success: false,
      reason: 'No printer name configured for this terminal',
    }
  }

  let qz: typeof import('qz-tray')
  try {
    qz = await import('qz-tray')
  } catch (e) {
    return { success: false, reason: `Failed to load qz-tray: ${String(e)}` }
  }

  // Configure certificate and signature promises (must be set before connect)
  qz.security.setCertificatePromise(async () => {
    const r = await fetch('/qz-certificate.pem')
    return r.text()
  })

  // Must use async function — QZ Tray checks constructor.name === "AsyncFunction"
  // and uses a different code path. A plain arrow function causes new Promise(fetchPromise)
  // which throws TypeError because the Promise object is not callable as a resolver.
  qz.security.setSignaturePromise(async (toSign: string) => {
    const r = await fetch('/api/qz/sign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ toSign }),
    })
    const data: { signature?: string; error?: string } = await r.json()
    if (!data.signature)
      throw new Error(data.error ?? 'Empty signature from server')
    return data.signature
  })

  qz.security.setSignatureAlgorithm('SHA512')

  // Always use a fresh connection to ensure semver is properly initialized.
  // Reusing an active connection risks using one in CONNECTING state where
  // semver hasn't been set yet, causing TypeError in qz.print → versionCompare.
  if (qz.websocket.isActive()) {
    try {
      await qz.websocket.disconnect()
    } catch {
      // ignore disconnect errors
    }
  }

  try {
    await qz.websocket.connect({ retries: 2, delay: 1 })

    const config = qz.configs.create(receipt.printerName)
    await qz.print(config, [
      {
        type: 'raw',
        format: 'command',
        flavor: 'plain',
        data: buildEscPos(receipt, t),
      },
    ])

    return { success: true }
  } catch (e) {
    return { success: false, reason: String(e) }
  } finally {
    if (qz.websocket.isActive()) {
      try {
        await qz.websocket.disconnect()
      } catch {
        // ignore disconnect errors
      }
    }
  }
}
