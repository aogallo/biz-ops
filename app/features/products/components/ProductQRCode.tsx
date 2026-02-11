import { useEffect, useRef, useState } from 'react'
import { Printer } from 'lucide-react'
import { Button } from '~/components/ui/button'

interface Props {
  productName: string
  sku: string
}

export function ProductQRCode({ productName, sku }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function generate() {
      try {
        const QRCode = await import('qrcode')
        if (cancelled || !canvasRef.current) return
        const url = `${window.location.origin}/products/${sku}`
        await QRCode.toCanvas(canvasRef.current, url, {
          width: 200,
          margin: 2,
          color: { dark: '#000000', light: '#ffffff' },
        })
      } catch {
        if (!cancelled) setError(true)
      }
    }
    generate()
    return () => { cancelled = true }
  }, [sku])

  const handlePrint = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const dataUrl = canvas.toDataURL('image/png')
    const printWindow = window.open('', '_blank')
    if (!printWindow) return
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>QR - ${productName}</title>
          <style>
            body { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; margin: 0; font-family: system-ui, sans-serif; }
            img { width: 200px; height: 200px; }
            h2 { margin: 16px 0 4px; font-size: 18px; }
            p { margin: 0; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <img src="${dataUrl}" />
          <h2>${productName}</h2>
          <p>SKU: ${sku}</p>
          <script>window.onload = () => { window.print(); window.close(); }</script>
        </body>
      </html>
    `)
    printWindow.document.close()
  }

  if (error) return null

  return (
    <div className='flex flex-col items-center gap-3'>
      <canvas ref={canvasRef} />
      <Button variant='outline' size='sm' onClick={handlePrint}>
        <Printer className='mr-2 size-4' />
        Print QR
      </Button>
    </div>
  )
}
