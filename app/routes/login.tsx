import { GalleryVerticalEnd, Globe } from 'lucide-react'
import {
  Form,
  redirect,
  useActionData,
  useFetcher,
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
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from '~/components/ui/field'
import { Input } from '~/components/ui/input'
import { useLocale, useTranslation } from '~/i18n/context'
import { getLocaleFromRequest, translateServer } from '~/i18n/translate.server'
import { getPostLoginRedirect } from '~/server/auth/access.server'
import auth from '~/server/auth-server'
import { getOptionalAuth } from '~/server/auth/session.server'
import type { Route } from './+types/login'

export async function loader({ request }: Route.LoaderArgs) {
  const session = await getOptionalAuth(request)

  // Redirect if already logged in
  if (session) {
    const redirectUrl = await getPostLoginRedirect(session.user.id)
    return redirect(redirectUrl)
  }

  // Extract messages from query params
  const url = new URL(request.url)
  const message = url.searchParams.get('message')
  const error = url.searchParams.get('error')

  return { message, error }
}

export async function action({ request }: Route.ActionArgs) {
  const locale = getLocaleFromRequest(request)
  const formData = await request.formData()
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    return { error: translateServer(locale, 'auth.emailRequired') }
  }

  try {
    // Use Better Auth server API with asResponse to get Response object
    const response = await auth.api.signInEmail({
      body: { email, password },
      asResponse: true,
    })

    // Check if sign in was successful
    if (response.ok) {
      // Extract session cookie from Better Auth response
      const setCookie = response.headers.get('set-cookie')

      // Parse response to get user data for smart redirect
      const data = (await response.json()) as { user: { id: string } }
      const redirectUrl = await getPostLoginRedirect(data.user.id)

      // Redirect with session cookies
      return redirect(redirectUrl, {
        headers: setCookie ? { 'set-cookie': setCookie } : {},
      })
    }

    // Sign in failed
    const errorData = await response.json().catch(() => ({}))
    return {
      error:
        (errorData as Error)?.message ||
        translateServer(locale, 'auth.invalidCredentials'),
    }
  } catch (error) {
    console.error('Login error:', error)
    return {
      error: translateServer(locale, 'auth.invalidCredentials'),
    }
  }
}

export default function LoginPage({ loaderData }: Route.ComponentProps) {
  const actionData = useActionData<typeof action>()
  const navigation = useNavigation()
  const isSubmitting = navigation.state === 'submitting'
  const { t } = useTranslation()
  const locale = useLocale()
  const localeFetcher = useFetcher()
  const nextLocale = locale === 'en' ? 'es' : 'en'

  return (
    <div className='bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10'>
      <div className='absolute top-4 right-4'>
        <localeFetcher.Form method='post' action='/action/set-locale'>
          <input type='hidden' name='locale' value={nextLocale} />
          <Button type='submit' variant='ghost' size='sm' className='gap-1.5'>
            <Globe className='size-4' />
            <span className='text-xs font-medium uppercase'>{locale}</span>
          </Button>
        </localeFetcher.Form>
      </div>
      <div className='flex w-full max-w-sm flex-col gap-6'>
        <a href='/' className='flex items-center gap-2 self-center font-medium'>
          <div className='bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md'>
            <GalleryVerticalEnd className='size-4' />
          </div>
          Business Operations
        </a>
        <Card>
          <CardHeader className='text-center'>
            <CardTitle className='text-xl'>{t('auth.welcomeBack')}</CardTitle>
            <CardDescription>{t('auth.loginDescription')}</CardDescription>
          </CardHeader>
          <CardContent>
            {loaderData?.message && (
              <div className='mb-4 rounded-md bg-green-50 p-3 text-sm text-green-700'>
                {loaderData.message}
              </div>
            )}
            {(loaderData?.error || actionData?.error) && (
              <div className='bg-destructive/10 text-destructive mb-4 rounded-md p-3 text-sm'>
                {loaderData?.error || actionData?.error}
              </div>
            )}
            <Form method='post'>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor='email'>{t('auth.email')}</FieldLabel>
                  <Input
                    id='email'
                    name='email'
                    type='email'
                    placeholder={t('auth.emailPlaceholder')}
                    required
                    disabled={isSubmitting}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor='password'>
                    {t('auth.password')}
                  </FieldLabel>
                  <Input
                    id='password'
                    name='password'
                    type='password'
                    required
                    disabled={isSubmitting}
                  />
                </Field>
                <Field>
                  <Button type='submit' disabled={isSubmitting}>
                    {isSubmitting ? t('auth.signingIn') : t('auth.login')}
                  </Button>
                  <FieldDescription className='text-center'>
                    {t('auth.noAccount')}
                  </FieldDescription>
                </Field>
              </FieldGroup>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
