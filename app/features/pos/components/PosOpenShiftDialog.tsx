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
import { useTranslation } from '~/i18n/context'

interface PosOpenShiftDialogProps {
  open: boolean
  onConfirm: (openingCashAmount: number) => void
  isSubmitting: boolean
}

export function PosOpenShiftDialog({
  open,
  onConfirm,
  isSubmitting,
}: PosOpenShiftDialogProps) {
  const { t } = useTranslation()
  const [amount, setAmount] = useState('')

  const parsedAmount = Number(amount) || 0

  function handleConfirm() {
    onConfirm(parsedAmount)
  }

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className='sm:max-w-sm' onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>{t('pos.openShift')}</DialogTitle>
        </DialogHeader>

        <div className='space-y-4'>
          <p className='text-muted-foreground text-sm'>
            {t('pos.mustOpenShift')}
          </p>
          <div>
            <label className='text-sm font-medium'>{t('pos.openingCash')}</label>
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
        </div>

        <DialogFooter>
          <Button
            onClick={handleConfirm}
            disabled={isSubmitting}
            className='w-full'
          >
            {isSubmitting ? t('pos.processing') : t('pos.openShift')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
