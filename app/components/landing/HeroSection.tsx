import {
  Calculator,
  CalendarDays,
  FileText,
  Package,
  Receipt,
} from 'lucide-react'
import { Link } from 'react-router'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'

export function HeroSection() {
  return (
    <section className='mx-auto grid max-w-6xl items-center gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:px-8 lg:py-32'>
      {/* Left content */}
      <div className='flex flex-col gap-6'>
        <Badge variant='secondary' className='w-fit'>
          Plataforma ERP para Guatemala
        </Badge>
        <h1 className='text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl'>
          Gestiona tu negocio con una plataforma{' '}
          <span className='text-primary'>integral</span>
        </h1>
        <p className='text-muted-foreground max-w-lg text-lg'>
          Contabilidad, procesamiento SAT, inventario, agenda de citas y
          facturación. Todo lo que necesitas para operar tu negocio en un solo
          lugar.
        </p>
        <div className='flex flex-wrap gap-3'>
          <Button size='lg' asChild>
            <Link to='/login'>Comenzar gratis</Link>
          </Button>
          <Button size='lg' variant='outline' asChild>
            <a href='#precios'>Ver planes</a>
          </Button>
        </div>
      </div>

      {/* Right side - Service icons grid */}
      <div className='hidden lg:block'>
        <div className='grid grid-cols-3 gap-4'>
          <ServiceIcon
            icon={<Calculator className='size-8' />}
            label='Contabilidad'
            className='accent-accounting-bg'
          />
          <ServiceIcon
            icon={<FileText className='size-8' />}
            label='SAT'
            className='accent-admin-bg'
          />
          <ServiceIcon
            icon={<Package className='size-8' />}
            label='Inventario'
            className='accent-inventory-bg'
          />
          <ServiceIcon
            icon={<CalendarDays className='size-8' />}
            label='Citas'
            className='accent-appointments-bg'
          />
          <ServiceIcon
            icon={<Receipt className='size-8' />}
            label='Facturación'
            className='bg-rose-500/10 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400'
          />
        </div>
      </div>
    </section>
  )
}

function ServiceIcon({
  icon,
  label,
  className,
}: {
  icon: React.ReactNode
  label: string
  className?: string
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-3 rounded-xl p-8 ${className}`}
    >
      {icon}
      <span className='text-sm font-medium'>{label}</span>
    </div>
  )
}
