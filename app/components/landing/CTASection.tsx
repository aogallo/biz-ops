import { Link } from 'react-router'
import { Button } from '~/components/ui/button'

export function CTASection() {
  return (
    <section className='bg-primary text-primary-foreground py-20'>
      <div className='mx-auto max-w-6xl px-4 text-center sm:px-6 lg:px-8'>
        <h2 className='text-3xl font-bold tracking-tight sm:text-4xl'>
          ¿Listo para modernizar tu negocio?
        </h2>
        <p className='text-primary-foreground/80 mx-auto mt-4 max-w-2xl text-lg'>
          Comenzá gratis hoy y descubrí cómo una plataforma integral puede
          transformar la forma en que operás.
        </p>
        <Button size='lg' variant='secondary' className='mt-8' asChild>
          <Link to='/login'>Comenzar gratis</Link>
        </Button>
      </div>
    </section>
  )
}
