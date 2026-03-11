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
import type { ReceiptData } from '~/features/pos/types'

interface PosReceiptPreviewProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  receipt: ReceiptData | null
  onPrint: (receipt: ReceiptData) => void
}

export function PosReceiptPreview({
  open,
  onOpenChange,
  receipt,
  onPrint,
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
          <div className='flex items-center gap-3'>
            {receipt.printerName && (
              <span className='text-muted-foreground flex items-center gap-1 text-sm'>
                <Printer className='size-3.5' />
                {receipt.printerName}
              </span>
            )}
            <Button onClick={() => onPrint(receipt)} className='gap-1.5'>
              <Printer className='size-4' />
              {t('pos.print')}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export type { ReceiptData } from '~/features/pos/types'
