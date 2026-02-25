import { Printer } from 'lucide-react'
import { Button } from '~/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog'
import { useTranslation } from '~/i18n/context'

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
  const { t } = useTranslation()

  if (!receipt) return null

  function handlePrint() {
    window.print()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-sm'>
        <DialogHeader>
          <DialogTitle>{t('pos.receipt')}</DialogTitle>
        </DialogHeader>

        <div id='pos-receipt' className='space-y-3 font-mono text-xs'>
          <div className='text-center'>
            <p className='text-sm font-bold'>{t('pos.saleReceipt')}</p>
            <p>{receipt.saleNumber}</p>
            <p>{receipt.date}</p>
          </div>

          <div className='border-t border-dashed pt-2'>
            <p>{t('pos.terminal')}: {receipt.terminalName}</p>
            <p>{t('pos.cashier')}: {receipt.cashierName}</p>
            <p>{t('pos.customer')}: {receipt.customerName ?? t('pos.defaultCustomer')}</p>
            {receipt.customerNit && <p>NIT: {receipt.customerNit}</p>}
          </div>

          <div className='border-t border-dashed pt-2'>
            <div className='mb-1 flex justify-between font-bold'>
              <span>{t('pos.product')}</span>
              <span>{t('pos.total')}</span>
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
              <span>{t('pos.subtotal')}</span>
              <span>Q{Number(receipt.subtotal).toFixed(2)}</span>
            </div>
            {Number(receipt.discountAmount) > 0 && (
              <div className='flex justify-between'>
                <span>{t('pos.discount')}</span>
                <span>-Q{Number(receipt.discountAmount).toFixed(2)}</span>
              </div>
            )}
            <div className='flex justify-between'>
              <span>IVA</span>
              <span>Q{Number(receipt.ivaAmount).toFixed(2)}</span>
            </div>
            <div className='flex justify-between text-sm font-bold'>
              <span>{t('pos.total')}</span>
              <span>Q{Number(receipt.total).toFixed(2)}</span>
            </div>
          </div>

          <div className='border-t border-dashed pt-2'>
            <p className='mb-1 font-bold'>{t('pos.payments')}:</p>
            {receipt.payments.map((payment, i) => (
              <div key={i} className='flex justify-between'>
                <span className='capitalize'>{payment.method}</span>
                <span>Q{Number(payment.amount).toFixed(2)}</span>
              </div>
            ))}
            {receipt.payments.some(
              (p) => p.receivedAmount !== null && Number(p.receivedAmount) > 0
            ) && (
              <>
                <div className='flex justify-between'>
                  <span>{t('pos.received')}</span>
                  <span>
                    Q
                    {receipt.payments
                      .reduce((sum, p) => sum + (p.receivedAmount !== null ? Number(p.receivedAmount) : 0), 0)
                      .toFixed(2)}
                  </span>
                </div>
                <div className='flex justify-between font-bold'>
                  <span>{t('pos.change')}</span>
                  <span>
                    Q
                    {receipt.payments
                      .reduce((sum, p) => sum + (p.changeAmount !== null ? Number(p.changeAmount) : 0), 0)
                      .toFixed(2)}
                  </span>
                </div>
              </>
            )}
          </div>

          <div className='border-t border-dashed pt-2 text-center'>
            <p>{t('pos.thankYou')}</p>
          </div>
        </div>

        <DialogFooter>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            {t('pos.close')}
          </Button>
          <Button onClick={handlePrint}>
            <Printer className='size-4' />
            {t('pos.print')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export type { ReceiptData }
