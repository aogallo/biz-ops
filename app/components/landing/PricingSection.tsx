import { Check, X } from 'lucide-react'
import { Link } from 'react-router'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '~/components/ui/card'
import { Separator } from '~/components/ui/separator'
import { useTranslation } from '~/i18n/context'
import type { TranslationKey } from '~/i18n/types'

type TierKey = 'starter' | 'pro' | 'enterprise'

interface FeatureRow {
  labelKey: TranslationKey
  starter: { type: 'boolean'; value: boolean } | { type: 'text'; key: TranslationKey }
  pro: { type: 'boolean'; value: boolean } | { type: 'text'; key: TranslationKey }
  enterprise: { type: 'boolean'; value: boolean } | { type: 'text'; key: TranslationKey }
}

const featureRows: FeatureRow[] = [
  {
    labelKey: 'landing.pricing.features.users' as TranslationKey,
    starter: { type: 'text', key: 'landing.pricing.starter.users' as TranslationKey },
    pro: { type: 'text', key: 'landing.pricing.pro.users' as TranslationKey },
    enterprise: { type: 'text', key: 'landing.pricing.enterprise.users' as TranslationKey },
  },
  {
    labelKey: 'landing.pricing.features.accounting' as TranslationKey,
    starter: { type: 'text', key: 'landing.pricing.starter.accounting' as TranslationKey },
    pro: { type: 'text', key: 'landing.pricing.pro.accounting' as TranslationKey },
    enterprise: { type: 'text', key: 'landing.pricing.enterprise.accounting' as TranslationKey },
  },
  {
    labelKey: 'landing.pricing.features.sat' as TranslationKey,
    starter: { type: 'boolean', value: false },
    pro: { type: 'boolean', value: true },
    enterprise: { type: 'boolean', value: true },
  },
  {
    labelKey: 'landing.pricing.features.inventory' as TranslationKey,
    starter: { type: 'text', key: 'landing.pricing.starter.inventory' as TranslationKey },
    pro: { type: 'text', key: 'landing.pricing.pro.inventory' as TranslationKey },
    enterprise: { type: 'text', key: 'landing.pricing.enterprise.inventory' as TranslationKey },
  },
  {
    labelKey: 'landing.pricing.features.appointments' as TranslationKey,
    starter: { type: 'text', key: 'landing.pricing.starter.appointments' as TranslationKey },
    pro: { type: 'text', key: 'landing.pricing.pro.appointments' as TranslationKey },
    enterprise: { type: 'text', key: 'landing.pricing.enterprise.appointments' as TranslationKey },
  },
  {
    labelKey: 'landing.pricing.features.invoicing' as TranslationKey,
    starter: { type: 'text', key: 'landing.pricing.starter.invoicing' as TranslationKey },
    pro: { type: 'text', key: 'landing.pricing.pro.invoicing' as TranslationKey },
    enterprise: { type: 'text', key: 'landing.pricing.enterprise.invoicing' as TranslationKey },
  },
  {
    labelKey: 'landing.pricing.features.support' as TranslationKey,
    starter: { type: 'text', key: 'landing.pricing.starter.support' as TranslationKey },
    pro: { type: 'text', key: 'landing.pricing.pro.support' as TranslationKey },
    enterprise: { type: 'text', key: 'landing.pricing.enterprise.support' as TranslationKey },
  },
]

function FeatureValue({ cell, t }: { cell: FeatureRow['starter']; t: (key: TranslationKey) => string }) {
  if (cell.type === 'boolean') {
    return cell.value ? (
      <Check className='size-4 text-green-600 dark:text-green-400' />
    ) : (
      <X className='text-muted-foreground size-4' />
    )
  }
  return <span className='text-sm'>{t(cell.key)}</span>
}

interface TierProps {
  nameKey: TranslationKey
  priceKey: TranslationKey
  descriptionKey: TranslationKey
  featureKey: TierKey
  highlighted?: boolean
  ctaKey: TranslationKey
}

function PricingTier({
  nameKey,
  priceKey,
  descriptionKey,
  featureKey,
  highlighted,
  ctaKey,
}: TierProps) {
  const { t } = useTranslation()

  return (
    <Card
      className={`flex flex-col ${highlighted ? 'border-primary border-2' : ''}`}
    >
      <CardHeader>
        <div className='flex items-center gap-2'>
          <CardTitle className='text-xl'>{t(nameKey)}</CardTitle>
          {highlighted && <Badge>{t('landing.pricing.badge')}</Badge>}
        </div>
        <CardDescription>{t(descriptionKey)}</CardDescription>
        <p className='mt-2 text-3xl font-bold tracking-tight'>{t(priceKey)}</p>
      </CardHeader>
      <Separator />
      <CardContent className='flex-1 pt-6'>
        <ul className='space-y-3'>
          {featureRows.map((feature) => (
            <li
              key={feature.labelKey}
              className='flex items-center justify-between'
            >
              <span className='text-muted-foreground text-sm'>
                {t(feature.labelKey)}
              </span>
              <FeatureValue cell={feature[featureKey]} t={t} />
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter>
        <Button
          className='w-full'
          variant={highlighted ? 'default' : 'outline'}
          asChild
        >
          <Link to='/login'>{t(ctaKey)}</Link>
        </Button>
      </CardFooter>
    </Card>
  )
}

export function PricingSection() {
  const { t } = useTranslation()

  return (
    <section id='precios' className='py-20'>
      <div className='mx-auto max-w-6xl px-4 sm:px-6 lg:px-8'>
        <div className='mb-12 text-center'>
          <h2 className='text-3xl font-bold tracking-tight sm:text-4xl'>
            {t('landing.pricing.title')}
          </h2>
          <p className='text-muted-foreground mt-3 text-lg'>
            {t('landing.pricing.subtitle')}
          </p>
        </div>
        <div className='grid items-stretch gap-6 md:grid-cols-3'>
          <PricingTier
            nameKey={'landing.pricing.starter.name' as TranslationKey}
            priceKey={'landing.pricing.starter.price' as TranslationKey}
            descriptionKey={'landing.pricing.starter.description' as TranslationKey}
            featureKey='starter'
            ctaKey={'landing.pricing.starter.cta' as TranslationKey}
          />
          <PricingTier
            nameKey={'landing.pricing.pro.name' as TranslationKey}
            priceKey={'landing.pricing.pro.price' as TranslationKey}
            descriptionKey={'landing.pricing.pro.description' as TranslationKey}
            featureKey='pro'
            highlighted
            ctaKey={'landing.pricing.pro.cta' as TranslationKey}
          />
          <PricingTier
            nameKey={'landing.pricing.enterprise.name' as TranslationKey}
            priceKey={'landing.pricing.enterprise.price' as TranslationKey}
            descriptionKey={'landing.pricing.enterprise.description' as TranslationKey}
            featureKey='enterprise'
            ctaKey={'landing.pricing.enterprise.cta' as TranslationKey}
          />
        </div>
      </div>
    </section>
  )
}
