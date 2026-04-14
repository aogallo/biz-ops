import { useTranslation } from '~/i18n/context'

export function CTASection() {
  const { t } = useTranslation()

  return (
    <section className='bg-primary text-primary-foreground py-20'>
      <div className='mx-auto max-w-6xl px-4 text-center sm:px-6 lg:px-8'>
        <h2 className='text-3xl font-bold tracking-tight sm:text-4xl'>
          {t('landing.cta.title')}
        </h2>
        <p className='text-primary-foreground/80 mx-auto mt-4 max-w-2xl text-lg'>
          {t('landing.cta.subtitle')}
        </p>
        {/*<Button size='lg' variant='secondary' className='mt-8' asChild>
          <Link to='/login'>{t('landing.cta.button')}</Link>
        </Button>
	*/}
      </div>
    </section>
  )
}
