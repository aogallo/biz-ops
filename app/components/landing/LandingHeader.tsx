import { GalleryVerticalEnd, Globe, Menu } from 'lucide-react'
import { Link, useFetcher } from 'react-router'
import { Button } from '~/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '~/components/ui/sheet'
import { useLocale, useTranslation } from '~/i18n/context'

function LandingLocaleToggle() {
  const locale = useLocale()
  const fetcher = useFetcher()
  const nextLocale = locale === 'en' ? 'es' : 'en'

  return (
    <fetcher.Form method='post' action='/action/set-locale'>
      <input type='hidden' name='locale' value={nextLocale} />
      <Button type='submit' variant='ghost' size='sm' className='gap-1.5'>
        <Globe className='size-4' />
        <span className='text-xs font-medium uppercase'>{locale}</span>
      </Button>
    </fetcher.Form>
  )
}

interface LandingHeaderProps {
  isAuthenticated: boolean
}

export function LandingHeader({ isAuthenticated }: LandingHeaderProps) {
  const { t } = useTranslation()

  return (
    <header className='bg-background/80 sticky top-0 z-50 border-b backdrop-blur-md'>
      <div className='mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8'>
        {/* Logo */}
        <Link to='/' className='flex items-center gap-2 font-semibold'>
          <div className='bg-primary text-primary-foreground flex size-7 items-center justify-center rounded-md'>
            <GalleryVerticalEnd className='size-4' />
          </div>
          <span className='text-lg'>Business Operations</span>
        </Link>

        {/* Desktop Nav */}
        <nav className='hidden items-center gap-6 md:flex'>
          <a
            href='#servicios'
            className='text-muted-foreground hover:text-foreground text-sm font-medium transition-colors'
          >
            {t('landing.nav.services')}
          </a>
          <a
            href='#precios'
            className='text-muted-foreground hover:text-foreground text-sm font-medium transition-colors'
          >
            {t('landing.nav.pricing')}
          </a>
        </nav>

        {/* Desktop CTAs */}
        <div className='hidden items-center gap-2 md:flex'>
          <LandingLocaleToggle />
          {isAuthenticated ? (
            <Button asChild>
              <Link to='/dashboard'>{t('landing.nav.dashboard')}</Link>
            </Button>
          ) : (
            <>
              <Button asChild>
                <Link to='/login'>{t('landing.nav.login')}</Link>
              </Button>
            </>
          )}
        </div>

        {/* Mobile Menu */}
        <Sheet>
          <SheetTrigger asChild>
            <Button variant='ghost' size='icon' className='md:hidden'>
              <Menu className='size-5' />
              <span className='sr-only'>Menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side='right'>
            <SheetHeader>
              <SheetTitle className='flex items-center gap-2'>
                <div className='bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md'>
                  <GalleryVerticalEnd className='size-3' />
                </div>
                Business Operations
              </SheetTitle>
            </SheetHeader>
            <nav className='mt-6 flex flex-col gap-4'>
              <a
                href='#servicios'
                className='text-muted-foreground hover:text-foreground text-sm font-medium transition-colors'
              >
                {t('landing.nav.services')}
              </a>
              <a
                href='#precios'
                className='text-muted-foreground hover:text-foreground text-sm font-medium transition-colors'
              >
                {t('landing.nav.pricing')}
              </a>
              <div className='mt-2'>
                <LandingLocaleToggle />
              </div>
              <div className='mt-4 flex flex-col gap-2'>
                {isAuthenticated ? (
                  <Button asChild>
                    <Link to='/dashboard'>{t('landing.nav.dashboard')}</Link>
                  </Button>
                ) : (
                  <>
                    <Button variant='outline' asChild>
                      <Link to='/login'>{t('landing.nav.login')}</Link>
                    </Button>
                    <Button asChild>
                      <Link to='/login'>{t('landing.nav.start')}</Link>
                    </Button>
                  </>
                )}
              </div>
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  )
}
