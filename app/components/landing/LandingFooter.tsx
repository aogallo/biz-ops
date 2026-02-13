import { GalleryVerticalEnd } from 'lucide-react'
import { ModeToggle } from '~/components/ui/mode-toggle'

export function LandingFooter() {
  return (
    <footer className='bg-muted border-t'>
      <div className='mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8'>
        <div className='grid gap-8 md:grid-cols-4'>
          {/* Brand */}
          <div className='flex flex-col gap-3'>
            <div className='flex items-center gap-2 font-semibold'>
              <div className='bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md'>
                <GalleryVerticalEnd className='size-3' />
              </div>
              Business Operations
            </div>
            <p className='text-muted-foreground text-sm'>
              Plataforma ERP integral para negocios en Guatemala.
            </p>
          </div>

          {/* Producto */}
          <div>
            <h3 className='mb-3 text-sm font-semibold'>Producto</h3>
            <ul className='space-y-2'>
              <li>
                <a
                  href='#servicios'
                  className='text-muted-foreground hover:text-foreground text-sm transition-colors'
                >
                  Servicios
                </a>
              </li>
              <li>
                <a
                  href='#precios'
                  className='text-muted-foreground hover:text-foreground text-sm transition-colors'
                >
                  Precios
                </a>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className='mb-3 text-sm font-semibold'>Legal</h3>
            <ul className='space-y-2'>
              <li>
                <span className='text-muted-foreground text-sm'>
                  Terminos de servicio
                </span>
              </li>
              <li>
                <span className='text-muted-foreground text-sm'>
                  Politica de privacidad
                </span>
              </li>
            </ul>
          </div>

          {/* Contacto */}
          <div>
            <h3 className='mb-3 text-sm font-semibold'>Contacto</h3>
            <ul className='space-y-2'>
              <li>
                <span className='text-muted-foreground text-sm'>
                  soporte@businessops.gt
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className='mt-8 flex items-center justify-between border-t pt-8'>
          <p className='text-muted-foreground text-sm'>
            &copy; {new Date().getFullYear()} Business Operations. Todos los
            derechos reservados.
          </p>
          <ModeToggle />
        </div>
      </div>
    </footer>
  )
}
