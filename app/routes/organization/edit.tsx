import { useState } from 'react'
import {
  Form,
  Link,
  redirect,
  useActionData,
  useNavigation,
} from 'react-router'
import { Button } from '~/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card'
import { updateOrganization } from '~/features/organization/server/actions/update.action'
import { organizationRepository } from '~/features/organization/server/repository'
import { getLocaleFromRequest, translateServer } from '~/i18n/translate.server'
import { requireAuth } from '~/server/auth/session.server'
import { redirectWithFlash } from '~/server/flash.server'
import type { Route } from './+types/edit'

export async function loader({ request, params, context }: Route.LoaderArgs) {
  await requireAuth(request)
  const { slug } = params

  const organization = await organizationRepository.getBySlug(slug)
  if (!organization) throw redirect('/organization')

  const appDomain = context?.cloudflare?.env?.APP_DOMAIN ?? 'bizops.app'
  return { organization, appDomain }
}

export async function action({ request, params }: Route.ActionArgs) {
  const locale = getLocaleFromRequest(request)
  const { slug } = params
  const formData = await request.formData()

  const result = await updateOrganization(slug, formData)

  if (result.success) {
    return redirectWithFlash(`/organization/${result.newSlug}`, {
      type: 'success',
      message:
        translateServer(locale, 'messages.organization.updated') ??
        'Organization updated.',
    })
  }

  return result
}

export default function EditOrganization({ loaderData }: Route.ComponentProps) {
  const { organization, appDomain } = loaderData
  const actionData = useActionData<typeof action>()
  const navigation = useNavigation()
  const isSubmitting = navigation.state === 'submitting'

  const [logoPreview, setLogoPreview] = useState<string | null>(
    organization.logo ?? null
  )
  const [domain, setDomain] = useState(organization.domain ?? '')

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = () => setLogoPreview(reader.result as string)
      reader.readAsDataURL(file)
    }
  }

  return (
    <div className='p-6'>
      <div className='mx-auto max-w-2xl space-y-6'>
        {/* Header */}
        <div className='flex items-center justify-between'>
          <div>
            <div className='text-muted-foreground mb-1 flex items-center gap-2 text-sm'>
              <Link
                to='/organization'
                className='hover:text-foreground transition-colors'
              >
                Organizations
              </Link>
              <span>/</span>
              <Link
                to={`/organization/${organization.slug}`}
                className='hover:text-foreground transition-colors'
              >
                {organization.name}
              </Link>
              <span>/</span>
              <span className='text-foreground'>Edit</span>
            </div>
            <h1 className='text-2xl font-semibold tracking-tight'>
              Edit Organization
            </h1>
          </div>
        </div>

        {actionData?.message && (
          <div className='bg-destructive/10 text-destructive rounded-md p-4 text-sm'>
            {actionData.message}
          </div>
        )}

        <Form method='post' encType='multipart/form-data'>
          {/* Keep current logo as fallback if no new file selected */}
          <input
            type='hidden'
            name='currentLogo'
            value={organization.logo ?? ''}
          />

          <Card className='rounded-xl shadow-sm'>
            <CardHeader>
              <CardTitle className='text-base font-semibold'>
                Organization Info
              </CardTitle>
              <CardDescription>
                Update name, slug, logo and domain.
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-5'>
              {/* Logo */}
              <div>
                <label
                  htmlFor='logo'
                  className='mb-2 block text-sm font-medium'
                >
                  Logo
                </label>
                <div className='flex items-center gap-4'>
                  {logoPreview ? (
                    <img
                      src={logoPreview}
                      alt='Logo preview'
                      className='h-16 w-16 rounded-full border object-cover'
                    />
                  ) : (
                    <div className='bg-muted text-muted-foreground flex h-16 w-16 items-center justify-center rounded-full border text-xl font-semibold'>
                      {organization.name?.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <input
                    type='file'
                    id='logo'
                    name='logo'
                    accept='image/*'
                    onChange={handleLogoChange}
                    className='border-input bg-background file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 w-full rounded-md border px-3 py-2 text-sm file:mr-4 file:rounded-md file:border-0 file:px-3 file:py-1.5 file:text-sm file:font-medium'
                  />
                </div>
              </div>

              {/* Name */}
              <div>
                <label
                  htmlFor='name'
                  className='mb-1.5 block text-sm font-medium'
                >
                  Name
                </label>
                <input
                  type='text'
                  id='name'
                  name='name'
                  required
                  defaultValue={organization.name ?? ''}
                  className='border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none'
                />
              </div>

              {/* Slug */}
              <div>
                <label
                  htmlFor='slug'
                  className='mb-1.5 block text-sm font-medium'
                >
                  Slug
                </label>
                <input
                  type='text'
                  id='slug'
                  name='slug'
                  required
                  defaultValue={organization.slug ?? ''}
                  pattern='[a-z0-9-]+'
                  className='border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none'
                />
                <p className='text-muted-foreground mt-1 text-xs'>
                  Only lowercase letters, numbers and hyphens. Changing this
                  will update the URL.
                </p>
              </div>

              {/* Domain */}
              <div>
                <label
                  htmlFor='domain'
                  className='mb-1.5 block text-sm font-medium'
                >
                  Domain
                </label>
                <input
                  type='text'
                  id='domain'
                  name='domain'
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  placeholder='miempresa'
                  pattern='[a-z0-9-]*'
                  className='border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none'
                />
                {domain && (
                  <p className='text-muted-foreground mt-1 text-xs'>
                    URL:{' '}
                    <span className='text-foreground font-medium'>
                      https://{domain}.{appDomain}
                    </span>
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Footer actions */}
          <div className='mt-6 flex items-center gap-3'>
            <Button type='submit' disabled={isSubmitting}>
              {isSubmitting ? 'Saving…' : 'Save changes'}
            </Button>
            <Button variant='ghost' asChild>
              <Link to={`/organization/${organization.slug}`}>Cancel</Link>
            </Button>
          </div>
        </Form>
      </div>
    </div>
  )
}
