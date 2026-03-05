import { useState, useCallback, useEffect, useRef } from 'react'

export type PrinterStatus = 'unsupported' | 'disconnected' | 'connecting' | 'connected' | 'printing' | 'error'

interface UseThermalPrinterReturn {
  status: PrinterStatus
  error: string | null
  connect: () => Promise<void>
  disconnect: () => Promise<void>
  print: (data: Uint8Array) => Promise<void>
  isSupported: boolean
}

/**
 * Hook for Web Serial API integration with USB thermal printers (ESC/POS).
 * Compatible with 3nStar RPT series (RPT004, RPT006, RPT008, RPT009).
 *
 * Web Serial API requires Chrome/Edge 89+ and HTTPS (or localhost).
 * The user must grant permission once per port — the browser remembers it.
 */
export function useThermalPrinter(): UseThermalPrinterReturn {
  const isSupported = typeof navigator !== 'undefined' && 'serial' in navigator

  const [status, setStatus] = useState<PrinterStatus>(
    isSupported ? 'disconnected' : 'unsupported'
  )
  const [error, setError] = useState<string | null>(null)
  const portRef = useRef<SerialPort | null>(null)

  // Try to auto-connect to a previously authorized port on mount
  useEffect(() => {
    if (!isSupported) return

    navigator.serial!.getPorts().then((ports) => {
      if (ports.length > 0 && portRef.current === null) {
        const port = ports[0]
        portRef.current = port
        port
          .open({ baudRate: 9600 })
          .then(() => setStatus('connected'))
          .catch(() => {
            // Port might already be open or unavailable — not fatal
            portRef.current = null
          })
      }
    })
  }, [isSupported])

  const connect = useCallback(async () => {
    if (!isSupported) return
    setError(null)
    setStatus('connecting')

    try {
      const port = await navigator.serial!.requestPort()
      await port.open({ baudRate: 9600 })
      portRef.current = port
      setStatus('connected')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al conectar'
      // User cancelled the picker — treat as disconnected, not error
      if (err instanceof Error && err.name === 'NotFoundError') {
        setStatus('disconnected')
      } else {
        setStatus('error')
        setError(message)
      }
    }
  }, [isSupported])

  const disconnect = useCallback(async () => {
    const port = portRef.current
    if (!port) return

    try {
      await port.close()
    } catch {
      // Ignore close errors
    } finally {
      portRef.current = null
      setStatus('disconnected')
      setError(null)
    }
  }, [])

  const print = useCallback(async (data: Uint8Array) => {
    const port = portRef.current
    if (!port || !port.writable) {
      throw new Error('Impresora no conectada')
    }

    setStatus('printing')
    const writer = port.writable.getWriter()

    try {
      await writer.write(data)
    } finally {
      writer.releaseLock()
      setStatus('connected')
    }
  }, [])

  return { status, error, connect, disconnect, print, isSupported }
}
