import { Banknote, CreditCard, FileText } from 'lucide-react'
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
  const [method, setMethod] = useState<PaymentMethod>('cash')
  const [receivedAmount, setReceivedAmount] = useState('')
  const [reference, setReference] = useState('')

  const received = Number(receivedAmount) || 0
  const change = method === 'cash' ? Math.max(0, received - total) : 0
  const isValid =
    method === 'cash' ? received >= total : method === 'card' || reference

  function handleConfirm() {
    const payment: CheckoutPayment = {
      method,
      amount: total,
      ...(method === 'cash' && {
        receivedAmount: received,
        changeAmount: change,
      }),
      ...(method !== 'cash' && reference && { reference }),
    }
    onConfirm([payment])
  }

  function handleQuickAmount(amount: number) {
    setReceivedAmount(String(amount))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>Cobrar</DialogTitle>
        </DialogHeader>

        <div className='space-y-4'>
          {/* Total */}
          <div className='text-center'>
            <p className='text-muted-foreground text-sm'>Total a cobrar</p>
            <p className='text-3xl font-bold tabular-nums'>
              Q{total.toFixed(2)}
            </p>
          </div>

          <Separator />

          {/* Payment method */}
          <div className='grid grid-cols-3 gap-2'>
            <Button
              variant={method === 'cash' ? 'default' : 'outline'}
              onClick={() => setMethod('cash')}
              className='flex-col gap-1 py-3'
            >
              <Banknote className='size-5' />
              <span className='text-xs'>Efectivo</span>
            </Button>
            <Button
              variant={method === 'card' ? 'default' : 'outline'}
              onClick={() => setMethod('card')}
              className='flex-col gap-1 py-3'
            >
              <CreditCard className='size-5' />
              <span className='text-xs'>Tarjeta</span>
            </Button>
            <Button
              variant={method === 'check' ? 'default' : 'outline'}
              onClick={() => setMethod('check')}
              className='flex-col gap-1 py-3'
            >
              <FileText className='size-5' />
              <span className='text-xs'>Cheque</span>
            </Button>
          </div>

          {/* Cash calculator */}
          {method === 'cash' && (
            <div className='space-y-3'>
              <div>
                <label className='text-sm font-medium'>Monto recibido</label>
                <Input
                  type='number'
                  step='0.01'
                  min='0'
                  value={receivedAmount}
                  onChange={(e) => setReceivedAmount(e.target.value)}
                  placeholder='0.00'
                  className='mt-1 text-right text-lg tabular-nums'
                  autoFocus
                />
              </div>

              {/* Quick amounts */}
              <div className='grid grid-cols-4 gap-1.5'>
                {QUICK_AMOUNTS.map((amount) => (
                  <Button
                    key={amount}
                    variant='outline'
                    size='sm'
                    onClick={() => handleQuickAmount(amount)}
                    className='tabular-nums'
                  >
                    Q{amount}
                  </Button>
                ))}
                <Button
                  variant='secondary'
                  size='sm'
                  onClick={() =>
                    setReceivedAmount(String(Math.ceil(total)))
                  }
                  className='col-span-2 tabular-nums'
                >
                  Exacto Q{Math.ceil(total)}
                </Button>
                <Button
                  variant='secondary'
                  size='sm'
                  onClick={() => setReceivedAmount(String(total))}
                  className='col-span-2 tabular-nums'
                >
                  Exacto Q{total.toFixed(2)}
                </Button>
              </div>

              {/* Change */}
              <div
                className={cn(
                  'rounded-lg p-3 text-center',
                  received >= total
                    ? 'bg-green-50 dark:bg-green-950/30'
                    : 'bg-red-50 dark:bg-red-950/30'
                )}
              >
                <p className='text-sm font-medium'>Cambio</p>
                <p className='text-2xl font-bold tabular-nums'>
                  Q{change.toFixed(2)}
                </p>
              </div>
            </div>
          )}

          {/* Card / Check reference */}
          {method !== 'cash' && (
            <div>
              <label className='text-sm font-medium'>
                {method === 'card'
                  ? 'Últimos 4 dígitos (opcional)'
                  : 'Número de cheque'}
              </label>
              <Input
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder={
                  method === 'card' ? '1234' : 'No. cheque'
                }
                className='mt-1'
                autoFocus
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant='outline'
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!isValid || isSubmitting}
            className='min-w-32'
          >
            {isSubmitting ? 'Procesando...' : 'Confirmar Pago'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
