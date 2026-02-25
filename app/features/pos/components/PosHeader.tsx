import { ArrowDownUp, Clock, History, LogOut, XCircle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { Button } from '~/components/ui/button'
import { useTranslation } from '~/i18n/context'

interface PosHeaderProps {
  terminalName: string
  terminalId: string
  cashierName: string
  sessionId?: string | null
  sessionOpenedAt?: string | null
  onCloseShift?: () => void
  onCashMovement?: () => void
}

export function PosHeader({
  terminalName,
  terminalId,
  cashierName,
  sessionId,
  sessionOpenedAt,
  onCloseShift,
  onCashMovement,
}: PosHeaderProps) {
  const { t } = useTranslation()
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <header className='bg-background flex h-12 shrink-0 items-center justify-between border-b px-4'>
      <div className='flex items-center gap-4'>
        <span className='text-sm font-semibold'>{terminalName}</span>
        <span className='text-muted-foreground text-sm'>{cashierName}</span>
        {sessionId && sessionOpenedAt && (
          <span className='text-muted-foreground text-xs'>
            {t('pos.shiftOpenedAt')}{' '}
            {new Date(sessionOpenedAt).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        )}
      </div>
      <div className='flex items-center gap-2'>
        <div className='text-muted-foreground flex items-center gap-1.5 text-sm'>
          <Clock className='size-4' />
          <span className='tabular-nums'>
            {time.toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        </div>
        {sessionId && onCashMovement && (
          <Button variant='ghost' size='sm' onClick={onCashMovement}>
            <ArrowDownUp className='size-4' />
            <span className='hidden sm:inline'>{t('pos.cashMovement')}</span>
          </Button>
        )}
        {sessionId && onCloseShift && (
          <Button variant='ghost' size='sm' onClick={onCloseShift}>
            <XCircle className='size-4' />
            <span className='hidden sm:inline'>{t('pos.closeShift')}</span>
          </Button>
        )}
        <Button variant='ghost' size='sm' asChild>
          <Link
            to={
              sessionId
                ? `/pos/sales?sessionId=${sessionId}&terminalId=${terminalId}`
                : `/pos/sales?terminalId=${terminalId}`
            }
          >
            <History className='size-4' />
            <span className='hidden sm:inline'>{t('pos.sales')}</span>
          </Link>
        </Button>
        <Button variant='ghost' size='sm' asChild>
          <Link to='/pos'>
            <LogOut className='size-4' />
            <span className='hidden sm:inline'>{t('pos.exit')}</span>
          </Link>
        </Button>
      </div>
    </header>
  )
}
