import { ArrowLeft, Printer } from 'lucide-react'
import { Link, redirect } from 'react-router'
import { Button } from '~/components/ui/button'
import { Separator } from '~/components/ui/separator'
import { posRepository } from '~/features/pos/server/repository'
import { requireAuth } from '~/server/auth/session.server'
import { useTranslation } from '~/i18n/context'
import type { Route } from './+types/$id'

export async function loader({ params, request }: Route.LoaderArgs) {
  await requireAuth(request)
  const report = await posRepository.getZReportById(params.id)
  if (!report) throw redirect('/pos/sales')
  return { report }
}

export default function ZReportView({ loaderData }: Route.ComponentProps) {
  const { report } = loaderData
  const { t } = useTranslation()

  const rows = [
    { label: t('pos.totalSales'), value: report.totalSales },
    { label: t('pos.totalCashSales'), value: report.totalCashSales },
    { label: t('pos.totalCardSales'), value: report.totalCardSales },
    { label: t('pos.totalCheckSales'), value: report.totalCheckSales },
    { label: t('pos.totalRefunds'), value: report.totalRefunds },
    { label: t('pos.totalWithdrawals'), value: report.totalWithdrawals },
    { label: t('pos.totalDeposits'), value: report.totalDeposits },
    { label: t('pos.totalTax'), value: report.totalTax },
  ]

  return (
    <div className='flex flex-1 flex-col p-6'>
      <div className='mx-auto w-full max-w-lg'>
        <div className='mb-4 flex items-center gap-3'>
          <Button variant='ghost' size='icon' asChild>
            <Link to='/pos/sales'>
              <ArrowLeft className='size-4' />
            </Link>
          </Button>
          <h1 className='text-xl font-bold'>{t('pos.zReportTitle')}</h1>
        </div>

        <div id='z-report' className='bg-card space-y-4 rounded-lg border p-6'>
          <div className='text-center'>
            <h2 className='text-lg font-bold'>{t('pos.zReport')}</h2>
            <p className='text-muted-foreground text-sm'>{report.terminalName}</p>
          </div>

          <Separator />

          <div className='grid grid-cols-2 gap-3 text-sm'>
            <div>
              <p className='text-muted-foreground'>{t('pos.cashier')}</p>
              <p className='font-medium'>{report.cashierName}</p>
            </div>
            <div>
              <p className='text-muted-foreground'>{t('pos.orderCount')}</p>
              <p className='font-medium'>{report.orderCount ?? 0}</p>
            </div>
            <div>
              <p className='text-muted-foreground'>{t('pos.shiftOpenedAt')}</p>
              <p className='font-medium'>
                {new Date(report.openedAt).toLocaleString('es-GT')}
              </p>
            </div>
            <div>
              <p className='text-muted-foreground'>{t('pos.closeShift')}</p>
              <p className='font-medium'>
                {new Date(report.closedAt).toLocaleString('es-GT')}
              </p>
            </div>
          </div>

          <Separator />

          <div className='space-y-2'>
            {rows.map((row) => (
              <div key={row.label} className='flex justify-between text-sm'>
                <span className='text-muted-foreground'>{row.label}</span>
                <span className='tabular-nums font-medium'>
                  Q{Number(row.value ?? 0).toFixed(2)}
                </span>
              </div>
            ))}
          </div>

          <Separator />

          <div className='space-y-2'>
            <div className='flex justify-between text-sm'>
              <span className='text-muted-foreground'>{t('pos.openingCash')}</span>
              <span className='tabular-nums font-medium'>
                Q{Number(report.openingCash ?? 0).toFixed(2)}
              </span>
            </div>
            <div className='flex justify-between text-sm'>
              <span className='text-muted-foreground'>{t('pos.expectedCash')}</span>
              <span className='tabular-nums font-medium'>
                Q{Number(report.expectedCash ?? 0).toFixed(2)}
              </span>
            </div>
            <div className='flex justify-between text-sm'>
              <span className='text-muted-foreground'>{t('pos.closingCash')}</span>
              <span className='tabular-nums font-medium'>
                Q{Number(report.closingCash ?? 0).toFixed(2)}
              </span>
            </div>
            <div className='flex justify-between text-sm font-bold'>
              <span>{t('pos.cashDifference')}</span>
              <span className='tabular-nums'>
                Q{Number(report.cashDifference ?? 0).toFixed(2)}
              </span>
            </div>
          </div>

          {report.firstOrderTime && (
            <>
              <Separator />
              <div className='grid grid-cols-2 gap-3 text-sm'>
                <div>
                  <p className='text-muted-foreground'>{t('pos.firstOrder')}</p>
                  <p className='font-medium'>
                    {new Date(report.firstOrderTime).toLocaleTimeString('es-GT')}
                  </p>
                </div>
                {report.lastOrderTime && (
                  <div>
                    <p className='text-muted-foreground'>{t('pos.lastOrder')}</p>
                    <p className='font-medium'>
                      {new Date(report.lastOrderTime).toLocaleTimeString('es-GT')}
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        <div className='mt-4 flex justify-end'>
          <Button onClick={() => window.print()}>
            <Printer className='size-4' />
            {t('pos.printReport')}
          </Button>
        </div>
      </div>
    </div>
  )
}
