import { GalleryVerticalEnd } from 'lucide-react'
import { ModeToggle } from '~/components/ui/mode-toggle'
import { useTranslation } from '~/i18n/context'

export function LandingFooter() {
  const { t } = useTranslation()

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
              {t('landing.footer.description')}
            </p>
          </div>

          {/* Product */}
          <div>
            <h3 className='mb-3 text-sm font-semibold'>
              {t('landing.footer.product')}
            </h3>
            <ul className='space-y-2'>
              <li>
                <a
                  href='#servicios'
                  className='text-muted-foreground hover:text-foreground text-sm transition-colors'
                >
                  {t('landing.footer.services')}
                </a>
              </li>
              <li>
                <a
                  href='#precios'
                  className='text-muted-foreground hover:text-foreground text-sm transition-colors'
                >
                  {t('landing.footer.pricing')}
                </a>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className='mb-3 text-sm font-semibold'>
              {t('landing.footer.legal')}
            </h3>
            <ul className='space-y-2'>
              <li>
                <span className='text-muted-foreground text-sm'>
                  {t('landing.footer.terms')}
                </span>
              </li>
              <li>
                <span className='text-muted-foreground text-sm'>
                  {t('landing.footer.privacy')}
                </span>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className='mb-3 text-sm font-semibold'>
              {t('landing.footer.contact')}
            </h3>
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
            {t('landing.footer.copyright', {
              year: new Date().getFullYear().toString(),
            })}
          </p>
          <ModeToggle />
        </div>
      </div>
    </footer>
  )
}
