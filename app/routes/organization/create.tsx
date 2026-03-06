import { useState } from 'react'
import { Form, useActionData, useNavigation } from 'react-router'
import { useTranslation } from '~/i18n/context'
import { getLocaleFromRequest, translateServer } from '~/i18n/translate.server'
import { requireAuth } from '~/server/auth/session.server'
import { redirectWithFlash } from '~/server/flash.server'
import { createOrganization } from '../../features/organization/server/actions/create.action'
import type { Route } from './+types/create'

export async function loader({ request, context }: Route.LoaderArgs) {
  await requireAuth(request)
  const appDomain = context.cloudflare.env.APP_DOMAIN ?? 'bizops.app'
  return { appDomain }
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

export default function CreateOrganization({ loaderData }: Route.ComponentProps) {
  const actionData = useActionData<typeof createOrganization>()
  const navigation = useNavigation()
  const { t } = useTranslation()
  const { appDomain } = loaderData

  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [domain, setDomain] = useState('')

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = () => setLogoPreview(reader.result as string)
      reader.readAsDataURL(file)
    } else {
      setLogoPreview(null)
    }
  }

  return (
    <div className='self-stretch p-6'>
      <div className='mx-auto max-w-2xl'>
        <h1 className='text-2xl font-bold'>{t('organization.createNew')}</h1>

        <Form method='post' encType='multipart/form-data' className='space-y-6'>
          {actionData?.message && (
            <div className='bg-destructive/10 text-destructive rounded-md p-4 text-sm'>
              {actionData.message}
            </div>
          )}

          {/* Logo */}
          <div>
            <label htmlFor='logo' className='mb-2 block text-sm font-medium'>
              Logo
            </label>
            <div className='flex items-center gap-4'>
              {logoPreview && (
                <img
                  src={logoPreview}
                  alt='Logo preview'
                  className='h-16 w-16 rounded-full object-cover border'
                />
              )}
              <input
                type='file'
                id='logo'
                name='logo'
                accept='image/*'
                onChange={handleLogoChange}
                className='border-input bg-background text-sm file:mr-4 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-primary-foreground hover:file:bg-primary/90 rounded-md border px-3 py-2 w-full'
              />
            </div>
          </div>

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

          {/* Domain */}
          <div>
            <label htmlFor='domain' className='mb-2 block text-sm font-medium'>
              Dominio
            </label>
            <input
              type='text'
              id='domain'
              name='domain'
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder='miempresa'
              pattern='[a-z0-9-]+'
              className='border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none'
            />
            {domain && (
              <p className='text-muted-foreground mt-1 text-xs'>
                Tu URL:{' '}
                <span className='text-foreground font-medium'>
                  https://{domain}.{appDomain}
                </span>
              </p>
            )}
            {!domain && (
              <p className='text-muted-foreground mt-1 text-xs'>
                Solo letras minúsculas, números y guiones. Ej: <code>mi-empresa</code>
              </p>
            )}
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
