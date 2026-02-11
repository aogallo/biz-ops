import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { Button } from '~/components/ui/button'

export function QRScanner() {
  const scannerRef = useRef<HTMLDivElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [scanning, setScanning] = useState(false)
  const scannerInstanceRef = useRef<{ stop: () => Promise<void> } | null>(null)
  const navigate = useNavigate()

  const startScanner = async () => {
    if (!scannerRef.current) return
    setError(null)
    setScanning(true)

    try {
      const { Html5Qrcode } = await import('html5-qrcode')
      const scannerId = 'qr-scanner-region'

      // Ensure the element has the ID
      scannerRef.current.id = scannerId

      const scanner = new Html5Qrcode(scannerId)
      scannerInstanceRef.current = scanner

      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          // Try to extract product path from the scanned URL
          try {
            const url = new URL(decodedText)
            const match = url.pathname.match(/\/products\/(.+)/)
            if (match) {
              scanner.stop().catch(() => {})
              navigate(`/products/${match[1]}`)
              return
            }
          } catch {
            // Not a URL — ignore
          }
        },
        () => {
          // Scan failure (no QR detected in frame) — ignore silently
        }
      )
    } catch (err) {
      setScanning(false)
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to start camera. Please ensure camera access is allowed.'
      )
    }
  }

  const stopScanner = async () => {
    if (scannerInstanceRef.current) {
      try {
        await scannerInstanceRef.current.stop()
      } catch {
        // Already stopped
      }
      scannerInstanceRef.current = null
    }
    setScanning(false)
  }

  useEffect(() => {
    return () => {
      stopScanner()
    }
  }, [])

  return (
    <div className='space-y-4'>
      <div
        ref={scannerRef}
        className='mx-auto max-w-md overflow-hidden rounded-lg bg-muted'
        style={{ minHeight: scanning ? 300 : 0 }}
      />

      {error && (
        <div className='rounded-md bg-destructive/10 p-3 text-sm text-destructive'>
          {error}
        </div>
      )}

      <div className='flex justify-center gap-3'>
        {!scanning ? (
          <Button onClick={startScanner}>Start Scanner</Button>
        ) : (
          <Button variant='outline' onClick={stopScanner}>
            Stop Scanner
          </Button>
        )}
      </div>

      <p className='text-center text-sm text-muted-foreground'>
        Point your camera at a product QR code to navigate directly to the product page.
      </p>
    </div>
  )
}
