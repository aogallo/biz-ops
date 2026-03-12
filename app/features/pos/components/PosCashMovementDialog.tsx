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
import { Textarea } from '~/components/ui/textarea'
import { useTranslation } from '~/i18n/context'

interface PosCashMovementDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (
    type: 'withdrawal' | 'deposit',
    amount: number,
    notes?: string
  ) => void
  isSubmitting: boolean
}

export function PosCashMovementDialog({
  open,
  onOpenChange,
  onConfirm,
  isSubmitting,
}: PosCashMovementDialogProps) {
  const { t } = useTranslation()
  const [type, setType] = useState<'withdrawal' | 'deposit'>('withdrawal')
  const [amount, setAmount] = useState('')
  const [notes, setNotes] = useState('')

  const parsedAmount = Number(amount) || 0

  function handleConfirm() {
    if (parsedAmount <= 0) return
    onConfirm(type, parsedAmount, notes || undefined)
    setAmount('')
    setNotes('')
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-sm'>
        <DialogHeader>
          <DialogTitle>{t('pos.cashMovement')}</DialogTitle>
        </DialogHeader>

        <div className='space-y-4'>
          <div className='grid grid-cols-2 gap-2'>
            <Button
              variant={type === 'withdrawal' ? 'default' : 'outline'}
              onClick={() => setType('withdrawal')}
            >
              {t('pos.withdrawal')}
            </Button>
            <Button
              variant={type === 'deposit' ? 'default' : 'outline'}
              onClick={() => setType('deposit')}
            >
              {t('pos.deposit')}
            </Button>
          </div>

          <div>
            <label className='text-sm font-medium'>
              {t('pos.movementAmount')}
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

          <div>
            <label className='text-sm font-medium'>
              {t('pos.movementNotes')}
            </label>
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
            disabled={parsedAmount <= 0 || isSubmitting}
          >
            {isSubmitting ? t('pos.processing') : t('pos.registerMovement')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
