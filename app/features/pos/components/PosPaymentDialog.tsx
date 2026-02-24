import { Banknote, CreditCard, FileText, Trash2 } from 'lucide-react'
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
import { cn } from '~/lib/utils'
import { useTranslation } from '~/i18n/context'
import type { CheckoutPayment } from '../schemas'

interface PosPaymentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  total: number
  onConfirm: (payments: CheckoutPayment[]) => void
  isSubmitting: boolean
}

type PaymentMethod = 'cash' | 'card' | 'check'

const QUICK_AMOUNTS = [1, 5, 10, 20, 50, 100, 200, 500]

export function PosPaymentDialog({
  open,
  onOpenChange,
  total,
  onConfirm,
  isSubmitting,
}: PosPaymentDialogProps) {
  const { t } = useTranslation()
  const [method, setMethod] = useState<PaymentMethod>('cash')
  const [amount, setAmount] = useState('')
  const [reference, setReference] = useState('')
  const [payments, setPayments] = useState<CheckoutPayment[]>([])

  const paidSoFar = payments.reduce((sum, p) => sum + p.amount, 0)
  const remaining = total - paidSoFar
  const currentAmount = Number(amount) || 0

  // For single cash payment (no split), track received/change
  const isSingleCashPayment = payments.length === 0 && method === 'cash'
  const change = isSingleCashPayment
    ? Math.max(0, currentAmount - total)
    : method === 'cash' && currentAmount > remaining
      ? currentAmount - remaining
      : 0

  const canAddPayment =
    method === 'cash'
      ? currentAmount > 0
      : method === 'card' || reference.length > 0

  const canConfirm = remaining <= 0

  function handleAddPayment() {
    const paymentAmount = method === 'cash'
      ? Math.min(currentAmount, remaining)
      : Math.min(currentAmount || remaining, remaining)

    const payment: CheckoutPayment = {
      method,
      amount: paymentAmount,
      ...(method === 'cash' && {
        receivedAmount: currentAmount,
        changeAmount: Math.max(0, currentAmount - paymentAmount),
      }),
      ...(method !== 'cash' && reference && { reference }),
    }

    setPayments((prev) => [...prev, payment])
    setAmount('')
    setReference('')
  }

  function handleRemovePayment(index: number) {
    setPayments((prev) => prev.filter((_, i) => i !== index))
  }

  function handleConfirm() {
    if (payments.length > 0) {
      onConfirm(payments)
    } else if (isSingleCashPayment && currentAmount >= total) {
      // Single full cash payment
      onConfirm([{
        method: 'cash',
        amount: total,
        receivedAmount: currentAmount,
        changeAmount: change,
      }])
    } else if (method !== 'cash') {
      // Single card/check payment
      onConfirm([{
        method,
        amount: total,
        ...(reference && { reference }),
      }])
    }
  }

  function handleQuickAmount(amt: number) {
    setAmount(String(amt))
  }

  // Reset state when dialog opens/closes
  function handleOpenChange(isOpen: boolean) {
    if (!isOpen) {
      setPayments([])
      setAmount('')
      setReference('')
      setMethod('cash')
    }
    onOpenChange(isOpen)
  }

  const isConfirmEnabled = payments.length > 0
    ? canConfirm
    : isSingleCashPayment
      ? currentAmount >= total
      : method === 'card' || reference.length > 0

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>{t('pos.collect')}</DialogTitle>
        </DialogHeader>

        <div className='space-y-4'>
          {/* Total */}
          <div className='text-center'>
            <p className='text-muted-foreground text-sm'>{t('pos.totalToCollect')}</p>
            <p className='text-3xl font-bold tabular-nums'>
              Q{total.toFixed(2)}
            </p>
          </div>

          {/* Added payments list */}
          {payments.length > 0 && (
            <div className='space-y-1'>
              {payments.map((p, i) => (
                <div key={i} className='flex items-center justify-between rounded-md bg-muted/50 px-3 py-1.5 text-sm'>
                  <span className='capitalize'>{t(`pos.${p.method}`)}</span>
                  <div className='flex items-center gap-2'>
                    <span className='tabular-nums font-medium'>Q{p.amount.toFixed(2)}</span>
                    <Button
                      variant='ghost'
                      size='icon-xs'
                      onClick={() => handleRemovePayment(i)}
                      className='text-destructive'
                    >
                      <Trash2 className='size-3' />
                    </Button>
                  </div>
                </div>
              ))}
              <div className='flex justify-between px-3 pt-1 text-sm font-bold'>
                <span>{t('pos.remaining')}</span>
                <span className={cn('tabular-nums', remaining <= 0 ? 'text-green-600' : 'text-orange-600')}>
                  Q{Math.max(0, remaining).toFixed(2)}
                </span>
              </div>
              <Separator />
            </div>
          )}

          {/* Payment method selector (only show if remaining > 0) */}
          {remaining > 0 && (
            <>
              <div className='grid grid-cols-3 gap-2'>
                <Button
                  variant={method === 'cash' ? 'default' : 'outline'}
                  onClick={() => setMethod('cash')}
                  className='h-auto flex-col gap-1 py-3'
                >
                  <Banknote className='size-5' />
                  <span className='text-xs'>{t('pos.cash')}</span>
                </Button>
                <Button
                  variant={method === 'card' ? 'default' : 'outline'}
                  onClick={() => setMethod('card')}
                  className='h-auto flex-col gap-1 py-3'
                >
                  <CreditCard className='size-5' />
                  <span className='text-xs'>{t('pos.card')}</span>
                </Button>
                <Button
                  variant={method === 'check' ? 'default' : 'outline'}
                  onClick={() => setMethod('check')}
                  className='h-auto flex-col gap-1 py-3'
                >
                  <FileText className='size-5' />
                  <span className='text-xs'>{t('pos.check')}</span>
                </Button>
              </div>

              {/* Cash calculator */}
              {method === 'cash' && (
                <div className='space-y-3'>
                  <div>
                    <label className='text-sm font-medium'>{t('pos.receivedAmount')}</label>
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

                  <div className='grid grid-cols-4 gap-1.5'>
                    {QUICK_AMOUNTS.map((amt) => (
                      <Button
                        key={amt}
                        variant='outline'
                        size='sm'
                        onClick={() => handleQuickAmount(amt)}
                        className='tabular-nums'
                      >
                        Q{amt}
                      </Button>
                    ))}
                    <Button
                      variant='secondary'
                      size='sm'
                      onClick={() => setAmount(String(Math.ceil(payments.length > 0 ? remaining : total)))}
                      className='col-span-2 tabular-nums'
                    >
                      {t('pos.exact')} Q{Math.ceil(payments.length > 0 ? remaining : total)}
                    </Button>
                    <Button
                      variant='secondary'
                      size='sm'
                      onClick={() => setAmount(String(payments.length > 0 ? remaining : total))}
                      className='col-span-2 tabular-nums'
                    >
                      {t('pos.exact')} Q{(payments.length > 0 ? remaining : total).toFixed(2)}
                    </Button>
                  </div>

                  {/* Change display */}
                  {payments.length === 0 && (
                    <div
                      className={cn(
                        'rounded-lg p-3 text-center',
                        currentAmount >= total
                          ? 'bg-green-50 dark:bg-green-950/30'
                          : 'bg-red-50 dark:bg-red-950/30'
                      )}
                    >
                      <p className='text-sm font-medium'>{t('pos.change')}</p>
                      <p className='text-2xl font-bold tabular-nums'>
                        Q{change.toFixed(2)}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Card / Check reference */}
              {method !== 'cash' && (
                <div className='space-y-3'>
                  <div>
                    <label className='text-sm font-medium'>{t('pos.amount')}</label>
                    <Input
                      type='number'
                      step='0.01'
                      min='0'
                      value={amount || String(remaining)}
                      onChange={(e) => setAmount(e.target.value)}
                      className='mt-1 text-right text-lg tabular-nums'
                    />
                  </div>
                  <div>
                    <label className='text-sm font-medium'>
                      {method === 'card' ? t('pos.last4Digits') : t('pos.checkNumber')}
                    </label>
                    <Input
                      value={reference}
                      onChange={(e) => setReference(e.target.value)}
                      placeholder={method === 'card' ? '1234' : t('pos.checkNumber')}
                      className='mt-1'
                      autoFocus
                    />
                  </div>
                </div>
              )}

              {/* Add payment button for split payments */}
              {payments.length > 0 && (
                <Button
                  variant='secondary'
                  onClick={handleAddPayment}
                  disabled={!canAddPayment}
                  className='w-full'
                >
                  {t('pos.addPayment')}
                </Button>
              )}
            </>
          )}
        </div>

        <DialogFooter>
          <Button
            variant='outline'
            onClick={() => handleOpenChange(false)}
            disabled={isSubmitting}
          >
            {t('common.cancel')}
          </Button>
          {payments.length === 0 && remaining > 0 && (
            <Button
              variant='secondary'
              onClick={handleAddPayment}
              disabled={!canAddPayment}
            >
              {t('pos.splitPayment')}
            </Button>
          )}
          <Button
            onClick={handleConfirm}
            disabled={!isConfirmEnabled || isSubmitting}
            className='min-w-32'
          >
            {isSubmitting ? t('pos.processing') : t('pos.confirmPayment')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
