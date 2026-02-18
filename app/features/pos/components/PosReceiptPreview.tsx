import { Printer } from 'lucide-react'
import { Button } from '~/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog'

interface ReceiptLine {
  productName: string
  productSku: string
  quantity: string
  unitPrice: string
  total: string
}

interface ReceiptPayment {
  method: string
  amount: string
  receivedAmount: string | null
  changeAmount: string | null
}

interface ReceiptData {
  saleNumber: string
  terminalName: string | null
  cashierName: string | null
  customerName: string | null
  customerNit: string | null
  date: string
  lines: ReceiptLine[]
  payments: ReceiptPayment[]
  subtotal: string
  ivaAmount: string
  discountAmount: string
  total: string
  currency: string
}

interface PosReceiptPreviewProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  receipt: ReceiptData | null
}

export function PosReceiptPreview({
  open,
  onOpenChange,
  receipt,
}: PosReceiptPreviewProps) {
  if (!receipt) return null

  function handlePrint() {
    window.print()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-sm'>
        <DialogHeader>
          <DialogTitle>Recibo</DialogTitle>
        </DialogHeader>

        {/* Printable receipt */}
        <div id='pos-receipt' className='space-y-3 font-mono text-xs'>
          <div className='text-center'>
            <p className='text-sm font-bold'>RECIBO DE VENTA</p>
            <p>{receipt.saleNumber}</p>
            <p>{receipt.date}</p>
          </div>

          <div className='border-t border-dashed pt-2'>
            <p>Terminal: {receipt.terminalName}</p>
            <p>Cajero: {receipt.cashierName}</p>
            <p>Cliente: {receipt.customerName ?? 'Consumidor Final'}</p>
            {receipt.customerNit && <p>NIT: {receipt.customerNit}</p>}
          </div>

          <div className='border-t border-dashed pt-2'>
            <div className='mb-1 flex justify-between font-bold'>
              <span>Producto</span>
              <span>Total</span>
            </div>
            {receipt.lines.map((line, i) => (
              <div key={i} className='mb-1'>
                <p>{line.productName}</p>
                <div className='flex justify-between'>
                  <span>
                    {Number(line.quantity)} x Q{Number(line.unitPrice).toFixed(2)}
                  </span>
                  <span>Q{Number(line.total).toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>

          <div className='border-t border-dashed pt-2'>
            <div className='flex justify-between'>
              <span>Subtotal</span>
              <span>Q{Number(receipt.subtotal).toFixed(2)}</span>
            </div>
            {Number(receipt.discountAmount) > 0 && (
              <div className='flex justify-between'>
                <span>Descuento</span>
                <span>-Q{Number(receipt.discountAmount).toFixed(2)}</span>
              </div>
            )}
            <div className='flex justify-between'>
              <span>IVA</span>
              <span>Q{Number(receipt.ivaAmount).toFixed(2)}</span>
            </div>
            <div className='flex justify-between text-sm font-bold'>
              <span>TOTAL</span>
              <span>Q{Number(receipt.total).toFixed(2)}</span>
            </div>
          </div>

          <div className='border-t border-dashed pt-2'>
            <p className='mb-1 font-bold'>Pagos:</p>
            {receipt.payments.map((payment, i) => (
              <div key={i} className='flex justify-between'>
                <span className='capitalize'>{payment.method}</span>
                <span>Q{Number(payment.amount).toFixed(2)}</span>
              </div>
            ))}
            {receipt.payments.some(
              (p) => p.receivedAmount && Number(p.receivedAmount) > 0
            ) && (
              <>
                <div className='flex justify-between'>
                  <span>Recibido</span>
                  <span>
                    Q
                    {Number(
                      receipt.payments.find((p) => p.receivedAmount)
                        ?.receivedAmount
                    ).toFixed(2)}
                  </span>
                </div>
                <div className='flex justify-between font-bold'>
                  <span>Cambio</span>
                  <span>
                    Q
                    {Number(
                      receipt.payments.find((p) => p.changeAmount)
                        ?.changeAmount
                    ).toFixed(2)}
                  </span>
                </div>
              </>
            )}
          </div>

          <div className='border-t border-dashed pt-2 text-center'>
            <p>¡Gracias por su compra!</p>
          </div>
        </div>

        <DialogFooter>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
          <Button onClick={handlePrint}>
            <Printer className='size-4' />
            Imprimir
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export type { ReceiptData }
