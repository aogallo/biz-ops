import { Link, useSubmit } from 'react-router'
import { Button } from '~/components/ui/button'
import { useTranslation } from '~/i18n/context'
import { deleteOrganization } from '~/features/organization/server/actions/delete.action'
import { organizationRepository } from '~/features/organization/server/repository'
import { getLocaleFromRequest, translateServer } from '~/i18n/translate.server'
import { redirectWithFlash } from '~/server/flash.server'
import type { Route } from './+types/show'

export async function loader({ params, context }: Route.LoaderArgs) {
  const { slug } = params

  const organization = await organizationRepository.getBySlug(slug)
  const appDomain = context?.cloudflare?.env?.APP_DOMAIN ?? 'bizops.app'

  return { organization, appDomain }
}

export async function action({ request, params }: Route.ActionArgs) {
  const locale = getLocaleFromRequest(request)
  const { slug } = params
  const result = await deleteOrganization(request, slug)
  if (result.success) {
    return redirectWithFlash('/organization', {
      type: 'success',
      message: translateServer(locale, 'messages.organization.deleted'),
    })
  }
  return result
}

export default function Show({ loaderData }: Route.ComponentProps) {
  const { organization, appDomain } = loaderData
  const metadata = organization?.metadata ?? {}
  const submit = useSubmit()
  const { t } = useTranslation()

  const handleDelete = () => {
    if (
      confirm(
        `Are you sure you want to delete "${organization?.name}"? This action cannot be undone.`
      )
    ) {
      submit({}, { method: 'post' })
    }
  }

  return (
    <div className=''>
      <div className='mb-6 flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-bold'>{t('organization.settings')}</h1>
          <p className='text-muted-foreground'>
            {t('organization.settingsDescription')}
          </p>
        </div>
        <div>
          <Button variant='destructive' onClick={handleDelete}>
            {t('common.delete')}
          </Button>
          <Link to='/organization'>
            <Button variant='ghost'>{t('common.cancel')}</Button>
          </Link>
        </div>
      </div>

      {/* Logo and Basic Info */}
      <div className='bg-card flex items-center gap-6 rounded-lg border p-6 shadow-sm'>
        {organization?.logo && (
          <img
            src={organization.logo}
            alt={organization.name || 'Organization'}
            className='border-primary h-24 w-24 rounded-full border-2'
          />
        )}
        <div>
          <h2 className='text-2xl font-bold'>
            {organization?.name || 'Unknown User'}
          </h2>
          <p className='text-muted-foreground'>{organization?.slug}</p>
          {organization?.domain && (
            <a
              href={`https://${organization.domain}.${appDomain}`}
              target='_blank'
              rel='noopener noreferrer'
              className='text-primary text-sm hover:underline'
            >
              {organization.domain}.{appDomain}
            </a>
          )}
        </div>
      </div>

      {/* Raw User Data (for debugging) */}
      <details className='bg-card rounded-lg border p-6 shadow-sm'>
        <summary className='cursor-pointer text-lg font-semibold'>
          {' '}
          {t('organization.debugData')}
        </summary>
        <pre className='bg-muted mt-4 overflow-auto rounded p-4 text-xs'>
          {JSON.stringify(metadata, null, 2)}
        </pre>
      </details>
    </div>
  )
}
