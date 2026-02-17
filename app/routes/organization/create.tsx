import { Form, useActionData, useNavigation } from 'react-router'
import { useTranslation } from '~/i18n/context'
import { getLocaleFromRequest, translateServer } from '~/i18n/translate.server'
import { requireAuth } from '~/server/auth/session.server'
import { redirectWithFlash } from '~/server/flash.server'
import { createOrganization } from '../../features/organization/server/actions/create.action'
import type { Route } from './+types/create'

export async function loader({ request }: Route.LoaderArgs) {
  await requireAuth(request)
  return {}
}

export async function action({ request }: Route.ActionArgs) {
  const locale = getLocaleFromRequest(request)
  const data = await request.formData()
  const response = await createOrganization(request, data)
  if (response.success) {
    return redirectWithFlash('/organization', {
      type: 'success',
      message: translateServer(locale, 'messages.organization.created'),
    })
  }
  return response
}

export default function CreateOrganization() {
  const actionData = useActionData<typeof createOrganization>()
  const navigation = useNavigation()
  const { t } = useTranslation()

  return (
    <div className='self-stretch p-6'>
      <div className='mx-auto max-w-2xl'>
        <h1 className='text-2xl font-bold'>{t('organization.createNew')}</h1>

        <Form method='post' className='space-y-6'>
          {actionData?.message && (
            <div className='bg-destructive/10 text-destructive rounded-md p-4 text-sm'>
              {actionData.message}
            </div>
          )}

          <div>
            <label htmlFor='name' className='mb-2 block text-sm font-medium'>
              {t('organization.nameLabel')}
            </label>
            <input
              type='text'
              id='name'
              name='name'
              required
              placeholder={t('organization.namePlaceholder')}
              className='border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none'
            />
            <p className='text-muted-foreground mt-1 text-xs'>
              {t('organization.nameHelper')}
            </p>
          </div>

          <div>
            <label htmlFor='slug' className='mb-2 block text-sm font-medium'>
              {t('organization.slugLabel')}
            </label>
            <input
              type='text'
              id='slug'
              name='slug'
              required
              placeholder={t('organization.slugPlaceholder')}
              pattern='[a-z0-9-]+'
              className='border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none'
            />
            <p className='text-muted-foreground mt-1 text-xs'>
              {t('organization.slugHelper')}
            </p>
          </div>

          <div className='flex gap-3'>
            <button
              type='submit'
              className='bg-primary text-primary-foreground hover:bg-primary/90 rounded-md px-4 py-2 text-sm font-medium'
            >
              {navigation.state === 'submitting' ? t('organization.creating') : t('common.create')}
            </button>
            <a
              href='/organization'
              className='border-input hover:bg-accent hover:text-accent-foreground rounded-md border px-4 py-2 text-sm font-medium'
            >
              {t('common.cancel')}
            </a>
          </div>
        </Form>
      </div>
    </div>
  )
}
