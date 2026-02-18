import { Clock, History, LogOut } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { Button } from '~/components/ui/button'

interface PosHeaderProps {
  terminalName: string
  cashierName: string
}

export function PosHeader({ terminalName, cashierName }: PosHeaderProps) {
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
      </div>
      <div className='flex items-center gap-3'>
        <div className='text-muted-foreground flex items-center gap-1.5 text-sm'>
          <Clock className='size-4' />
          <span className='tabular-nums'>
            {time.toLocaleTimeString('es-GT', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        </div>
        <Button variant='ghost' size='sm' asChild>
          <Link to='/pos/sales'>
            <History className='size-4' />
            <span className='hidden sm:inline'>Ventas</span>
          </Link>
        </Button>
        <Button variant='ghost' size='sm' asChild>
          <Link to='/pos'>
            <LogOut className='size-4' />
            <span className='hidden sm:inline'>Salir</span>
          </Link>
        </Button>
      </div>
    </header>
  )
}
