import { useState } from 'react'
import { Button } from '~/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog'
import { Input } from '~/components/ui/input'
import { Separator } from '~/components/ui/separator'
import { Textarea } from '~/components/ui/textarea'
import { cn } from '~/lib/utils'
import { useTranslation } from '~/i18n/context'

interface PosCloseShiftDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (closingCashAmount: number, notes?: string) => void
  isSubmitting: boolean
  expectedCash?: number
}

export function PosCloseShiftDialog({
  open,
  onOpenChange,
  onConfirm,
  isSubmitting,
  expectedCash = 0,
}: PosCloseShiftDialogProps) {
  const { t } = useTranslation()
  const [amount, setAmount] = useState('')
  const [notes, setNotes] = useState('')

  const closingAmount = Number(amount) || 0
  const difference = closingAmount - expectedCash

  function handleConfirm() {
    onConfirm(closingAmount, notes || undefined)
    setAmount('')
    setNotes('')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-sm'>
        <DialogHeader>
          <DialogTitle>{t('pos.closeShift')}</DialogTitle>
        </DialogHeader>

        <div className='space-y-4'>
          <div>
            <label className='text-sm font-medium'>
              {t('pos.closingCash')}
            </label>
            <Input
              type='number'
              step='0.01'
              min='0'
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder='0.00'
              className='mt-1 text-right text-lg tabular-nums'
              autoFocus
            />
          </div>

          <Separator />

          <div className='space-y-2 text-sm'>
            <div className='flex justify-between'>
              <span className='text-muted-foreground'>
                {t('pos.expectedCash')}
              </span>
              <span className='font-medium tabular-nums'>
                Q{expectedCash.toFixed(2)}
              </span>
            </div>
            <div className='flex justify-between'>
              <span className='text-muted-foreground'>
                {t('pos.cashDifference')}
              </span>
              <span
                className={cn(
                  'font-bold tabular-nums',
                  difference < 0
                    ? 'text-red-600'
                    : difference > 0
                      ? 'text-green-600'
                      : ''
                )}
              >
                Q{difference.toFixed(2)}
              </span>
            </div>
          </div>

          <div>
            <label className='text-sm font-medium'>{t('pos.shiftNotes')}</label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className='mt-1'
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant='outline'
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            {t('common.cancel')}
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isSubmitting}
            variant='destructive'
          >
            {isSubmitting ? t('pos.processing') : t('pos.closeShift')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
