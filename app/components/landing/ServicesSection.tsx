import {
  Calculator,
  CalendarDays,
  FileText,
  Package,
  Receipt,
} from 'lucide-react'
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card'
import { useTranslation } from '~/i18n/context'
import type { TranslationKey } from '~/i18n/types'

const services = [
  {
    titleKey: 'landing.services.accounting.title' as TranslationKey,
    descriptionKey: 'landing.services.accounting.description' as TranslationKey,
    icon: Calculator,
    accent: 'accent-accounting-bg',
  },
  {
    titleKey: 'landing.services.sat.title' as TranslationKey,
    descriptionKey: 'landing.services.sat.description' as TranslationKey,
    icon: FileText,
    accent: 'accent-admin-bg',
  },
  {
    titleKey: 'landing.services.inventory.title' as TranslationKey,
    descriptionKey: 'landing.services.inventory.description' as TranslationKey,
    icon: Package,
    accent: 'accent-inventory-bg',
  },
  {
    titleKey: 'landing.services.appointments.title' as TranslationKey,
    descriptionKey: 'landing.services.appointments.description' as TranslationKey,
    icon: CalendarDays,
    accent: 'accent-appointments-bg',
  },
  {
    titleKey: 'landing.services.invoicing.title' as TranslationKey,
    descriptionKey: 'landing.services.invoicing.description' as TranslationKey,
    icon: Receipt,
    accent:
      'bg-rose-500/10 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400',
  },
] as const

export function ServicesSection() {
  const { t } = useTranslation()

  return (
    <section id='servicios' className='bg-muted/50 py-20'>
      <div className='mx-auto max-w-6xl px-4 sm:px-6 lg:px-8'>
        <div className='mb-12 text-center'>
          <h2 className='text-3xl font-bold tracking-tight sm:text-4xl'>
            {t('landing.services.title')}
          </h2>
          <p className='text-muted-foreground mt-3 text-lg'>
            {t('landing.services.subtitle')}
          </p>
        </div>
        <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-3'>
          {services.map((service) => (
            <Card
              key={service.titleKey}
              className='transition-all duration-300 hover:-translate-y-1 hover:shadow-md'
            >
              <CardHeader>
                <div
                  className={`mb-3 w-fit rounded-lg p-2.5 ${service.accent}`}
                >
                  <service.icon className='size-5' />
                </div>
                <CardTitle>{t(service.titleKey)}</CardTitle>
                <CardDescription>{t(service.descriptionKey)}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
