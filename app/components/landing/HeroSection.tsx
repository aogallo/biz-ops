import {
  Calculator,
  CalendarDays,
  FileText,
  Package,
  Receipt,
} from 'lucide-react'
import { Badge } from '~/components/ui/badge'
import { useTranslation } from '~/i18n/context'

export function HeroSection() {
  const { t } = useTranslation()

  return (
    <section className='mx-auto grid max-w-6xl items-center gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:px-8 lg:py-32'>
      {/* Left content */}
      <div className='flex flex-col gap-6'>
        <Badge variant='secondary' className='w-fit'>
          {t('landing.badge')}
        </Badge>
        <h1 className='text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl'>
          {t('landing.headline')}{' '}
          <span className='text-primary'>{t('landing.headlineHighlight')}</span>{' '}
          {t('landing.headlineSuffix')}
        </h1>
        <p className='text-muted-foreground max-w-lg text-lg'>
          {t('landing.subtitle')}
        </p>
        {/*        <div className='flex flex-wrap gap-3'>
          <Button size='lg' asChild>
            <Link to='/login'>{t('landing.ctaStart')}</Link>
          </Button>
          <Button size='lg' variant='outline' asChild>
            <a href='#precios'>{t('landing.ctaPlans')}</a>
          </Button>
        </div>
	*/}
      </div>

      {/* Right side - Service icons grid */}
      <div className='hidden lg:block'>
        <div className='grid grid-cols-3 gap-4'>
          <ServiceIcon
            icon={<Calculator className='size-8' />}
            label={t('landing.services.accounting.title')}
            className='accent-accounting-bg'
          />
          <ServiceIcon
            icon={<FileText className='size-8' />}
            label={t('landing.services.sat.title')}
            className='accent-admin-bg'
          />
          <ServiceIcon
            icon={<Package className='size-8' />}
            label={t('landing.services.inventory.title')}
            className='accent-inventory-bg'
          />
          <ServiceIcon
            icon={<CalendarDays className='size-8' />}
            label={t('landing.services.appointments.title')}
            className='accent-appointments-bg'
          />
          <ServiceIcon
            icon={<Receipt className='size-8' />}
            label={t('landing.services.invoicing.title')}
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
