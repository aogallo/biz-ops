import { ArrowLeft, Printer, XCircle } from 'lucide-react'
import { Link, useFetcher, redirect } from 'react-router'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Separator } from '~/components/ui/separator'
import { posRepository } from '~/features/pos/server/repository'
import { voidSaleAction } from '~/features/pos/server/actions/void-sale.action'
import { getOptionalAuth } from '~/server/auth/session.server'
import { getPosSession } from '~/server/auth/pos-session.server'
import { useTranslation } from '~/i18n/context'
import type { Route } from './+types/$id'

export async function loader({ params, request }: Route.LoaderArgs) {
  const [userSession, posSession] = await Promise.all([
    getOptionalAuth(request),
    getPosSession(request),
  ])
  if (!userSession && !posSession) throw redirect('/pos-login')

  const sale = await posRepository.getSaleById(params.id)
  if (!sale) throw redirect('/pos/sales')
  return { sale, canVoid: !!userSession }
}

export async function action({ params, request }: Route.ActionArgs) {
  const [userSession] = await Promise.all([getOptionalAuth(request)])
  if (!userSession) throw redirect('/pos-login')

  const formData = await request.formData()
  const intent = formData.get('intent')

  if (intent === 'void') {
    try {
      await voidSaleAction(params.id, userSession.user.id)
      return { success: true }
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Error voiding sale',
      }
    }
  }

  return { error: 'Unknown intent' }
}

export default function PosSaleDetail({ loaderData }: Route.ComponentProps) {
  const { sale, canVoid } = loaderData
  const { t } = useTranslation()
  const fetcher = useFetcher<typeof action>()

  return (
    <div className='flex flex-1 flex-col p-6'>
      <div className='mx-auto w-full max-w-2xl'>
        <div className='mb-4 flex items-center gap-3'>
          <Button variant='ghost' size='icon' asChild>
            <Link to='/pos/sales'>
              <ArrowLeft className='size-4' />
            </Link>
          </Button>
          <h1 className='text-xl font-bold'>
            {t('pos.sale')} {sale.saleNumber}
          </h1>
          <Badge
            variant={
              sale.status === 'completed' ? 'default' : 'destructive'
            }
          >
            {sale.status === 'completed' ? t('pos.completed') : t('pos.voided')}
          </Badge>
        </div>

        {fetcher.data && 'error' in fetcher.data && (
          <div className='mb-4 rounded-md bg-red-50 p-3 text-sm text-red-600 dark:bg-red-950/30'>
            {fetcher.data.error}
          </div>
        )}

        <div className='bg-card space-y-4 rounded-lg border p-6'>
          <div className='grid grid-cols-2 gap-4 text-sm'>
            <div>
              <p className='text-muted-foreground'>{t('pos.terminalCol')}</p>
              <p className='font-medium'>{sale.terminal?.name}</p>
            </div>
            <div>
              <p className='text-muted-foreground'>{t('pos.cashierCol')}</p>
              <p className='font-medium'>{sale.cashier?.name}</p>
            </div>
            <div>
              <p className='text-muted-foreground'>{t('pos.customerCol')}</p>
              <p className='font-medium'>
                {sale.businessPartner?.name ?? t('pos.defaultCustomer')}
              </p>
            </div>
            <div>
              <p className='text-muted-foreground'>{t('pos.dateCol')}</p>
              <p className='font-medium'>
                {new Date(sale.createdAt).toLocaleString('es-GT')}
              </p>
            </div>
          </div>

          <Separator />

          <div>
            <h3 className='mb-2 text-sm font-semibold'>{t('pos.products')}</h3>
            <div className='space-y-2'>
              {sale.lines.map((line) => (
                <div
                  key={line.id}
                  className='flex items-center justify-between text-sm'
                >
                  <div>
                    <p className='font-medium'>{line.productName}</p>
                    <p className='text-muted-foreground text-xs'>
                      {Number(line.quantity)} x Q
                      {Number(line.unitPrice).toFixed(2)}
                    </p>
                  </div>
                  <span className='font-medium tabular-nums'>
                    Q{Number(line.total).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          <div className='space-y-1 text-sm'>
            <div className='flex justify-between'>
              <span className='text-muted-foreground'>{t('pos.subtotal')}</span>
              <span className='tabular-nums'>
                Q{Number(sale.subtotal).toFixed(2)}
              </span>
            </div>
            <div className='flex justify-between'>
              <span className='text-muted-foreground'>IVA</span>
              <span className='tabular-nums'>
                Q{Number(sale.ivaAmount).toFixed(2)}
              </span>
            </div>
            <div className='flex justify-between text-base font-bold'>
              <span>{t('pos.total')}</span>
              <span className='tabular-nums'>
                Q{Number(sale.total).toFixed(2)}
              </span>
            </div>
          </div>

          <Separator />

          <div>
            <h3 className='mb-2 text-sm font-semibold'>{t('pos.payments')}</h3>
            {sale.payments.map((payment) => (
              <div
                key={payment.id}
                className='flex justify-between text-sm'
              >
                <span className='capitalize'>{payment.method}</span>
                <span className='tabular-nums'>
                  Q{Number(payment.amount).toFixed(2)}
                </span>
              </div>
            ))}
          </div>

          {sale.status === 'completed' && (
            <>
              <Separator />
              <div className='flex gap-2'>
                <Button variant='outline' size='sm' onClick={() => window.print()}>
                  <Printer className='size-4' />
                  {t('pos.print')}
                </Button>
                {canVoid && (
                  <fetcher.Form method='post'>
                    <input type='hidden' name='intent' value='void' />
                    <Button
                      variant='destructive'
                      size='sm'
                      type='submit'
                      disabled={fetcher.state !== 'idle'}
                    >
                      <XCircle className='size-4' />
                      {fetcher.state === 'submitting'
                        ? t('pos.voiding')
                        : t('pos.voidSale')}
                    </Button>
                  </fetcher.Form>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
