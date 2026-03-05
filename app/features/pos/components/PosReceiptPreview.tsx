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
import { PosReceiptContent } from './PosReceiptContent'

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>{t('pos.receipt')}</DialogTitle>
        </DialogHeader>

        <PosReceiptContent receipt={receipt} />

        <DialogFooter>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            {t('pos.close')}
          </Button>
          <Button onClick={() => window.print()} className='gap-1.5'>
            <Printer className='size-4' />
            {t('pos.print')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export type { ReceiptData }
