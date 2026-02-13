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

const services = [
  {
    title: 'Contabilidad',
    description:
      'Libro diario, libro mayor, partidas contables y reportes financieros. Todo en cumplimiento con las normas guatemaltecas.',
    icon: Calculator,
    accent: 'accent-accounting-bg',
  },
  {
    title: 'Procesamiento SAT',
    description:
      'Procesa tus archivos de la SAT automaticamente. Genera libros de compras y ventas listos para presentar.',
    icon: FileText,
    accent: 'accent-admin-bg',
  },
  {
    title: 'Inventario',
    description:
      'Control de productos, categorias, movimientos de stock y codigos QR. Reportes de inventario en tiempo real.',
    icon: Package,
    accent: 'accent-inventory-bg',
  },
  {
    title: 'Agenda de Citas',
    description:
      'Gestiona citas con tus clientes, envia recordatorios automaticos y optimiza tu agenda diaria.',
    icon: CalendarDays,
    accent: 'accent-appointments-bg',
  },
  {
    title: 'Facturacion',
    description:
      'Crea y gestiona facturas profesionales. Control de pagos, estados y exportacion a PDF.',
    icon: Receipt,
    accent:
      'bg-rose-500/10 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400',
  },
] as const

export function ServicesSection() {
  return (
    <section id='servicios' className='bg-muted/50 py-20'>
      <div className='mx-auto max-w-6xl px-4 sm:px-6 lg:px-8'>
        <div className='mb-12 text-center'>
          <h2 className='text-3xl font-bold tracking-tight sm:text-4xl'>
            Todo lo que necesitas para operar
          </h2>
          <p className='text-muted-foreground mt-3 text-lg'>
            Cinco modulos integrados que cubren cada aspecto de tu negocio
          </p>
        </div>
        <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-3'>
          {services.map((service) => (
            <Card
              key={service.title}
              className='transition-all duration-300 hover:-translate-y-1 hover:shadow-md'
            >
              <CardHeader>
                <div
                  className={`mb-3 w-fit rounded-lg p-2.5 ${service.accent}`}
                >
                  <service.icon className='size-5' />
                </div>
                <CardTitle>{service.title}</CardTitle>
                <CardDescription>{service.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
