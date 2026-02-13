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

interface Feature {
  label: string
  starter: string | boolean
  pro: string | boolean
  enterprise: string | boolean
}

const features: Feature[] = [
  {
    label: 'Usuarios',
    starter: '1',
    pro: 'Hasta 5',
    enterprise: 'Ilimitados',
  },
  {
    label: 'Contabilidad',
    starter: 'Basica',
    pro: 'Completa',
    enterprise: 'Completa + reportes',
  },
  { label: 'Procesamiento SAT', starter: false, pro: true, enterprise: true },
  {
    label: 'Inventario',
    starter: '50 productos',
    pro: '500 productos',
    enterprise: 'Ilimitado',
  },
  {
    label: 'Citas',
    starter: '20/mes',
    pro: 'Ilimitadas',
    enterprise: 'Ilimitadas',
  },
  {
    label: 'Facturacion',
    starter: '10/mes',
    pro: 'Ilimitadas',
    enterprise: 'Ilimitadas',
  },
  {
    label: 'Soporte',
    starter: 'Comunidad',
    pro: 'Email',
    enterprise: 'Dedicado',
  },
]

function FeatureValue({ value }: { value: string | boolean }) {
  if (typeof value === 'boolean') {
    return value ? (
      <Check className='size-4 text-green-600 dark:text-green-400' />
    ) : (
      <X className='text-muted-foreground size-4' />
    )
  }
  return <span className='text-sm'>{value}</span>
}

interface TierProps {
  name: string
  price: string
  description: string
  featureKey: 'starter' | 'pro' | 'enterprise'
  highlighted?: boolean
  cta: string
}

function PricingTier({
  name,
  price,
  description,
  featureKey,
  highlighted,
  cta,
}: TierProps) {
  return (
    <Card
      className={`flex flex-col ${highlighted ? 'border-primary border-2' : ''}`}
    >
      <CardHeader>
        <div className='flex items-center gap-2'>
          <CardTitle className='text-xl'>{name}</CardTitle>
          {highlighted && <Badge>Mas popular</Badge>}
        </div>
        <CardDescription>{description}</CardDescription>
        <p className='mt-2 text-3xl font-bold tracking-tight'>{price}</p>
      </CardHeader>
      <Separator />
      <CardContent className='flex-1 pt-6'>
        <ul className='space-y-3'>
          {features.map((feature) => (
            <li
              key={feature.label}
              className='flex items-center justify-between'
            >
              <span className='text-muted-foreground text-sm'>
                {feature.label}
              </span>
              <FeatureValue value={feature[featureKey]} />
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
          <Link to='/login'>{cta}</Link>
        </Button>
      </CardFooter>
    </Card>
  )
}

export function PricingSection() {
  return (
    <section id='precios' className='py-20'>
      <div className='mx-auto max-w-6xl px-4 sm:px-6 lg:px-8'>
        <div className='mb-12 text-center'>
          <h2 className='text-3xl font-bold tracking-tight sm:text-4xl'>
            Planes para cada etapa de tu negocio
          </h2>
          <p className='text-muted-foreground mt-3 text-lg'>
            Comenza gratis y escala cuando lo necesites
          </p>
        </div>
        <div className='grid items-stretch gap-6 md:grid-cols-3'>
          <PricingTier
            name='Starter'
            price='Gratis'
            description='Para emprendedores que estan comenzando'
            featureKey='starter'
            cta='Comenzar gratis'
          />
          <PricingTier
            name='Pro'
            price='Q199/mes'
            description='Para negocios en crecimiento'
            featureKey='pro'
            highlighted
            cta='Comenzar con Pro'
          />
          <PricingTier
            name='Enterprise'
            price='Q499/mes'
            description='Para empresas que necesitan todo'
            featureKey='enterprise'
            cta='Contactar ventas'
          />
        </div>
      </div>
    </section>
  )
}
