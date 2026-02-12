import { GalleryVerticalEnd } from 'lucide-react'
import { Form, redirect, useActionData, useNavigation } from 'react-router'
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
  const formData = await request.formData()
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    return { error: 'Email and password are required' }
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
      error: (errorData as Error)?.message || 'Invalid email or password',
    }
  } catch (error) {
    console.error('Login error:', error)
    return { error: 'Invalid email or password' }
  }
}

export default function LoginPage({ loaderData }: Route.ComponentProps) {
  const actionData = useActionData<typeof action>()
  const navigation = useNavigation()
  const isSubmitting = navigation.state === 'submitting'

  return (
    <div className='bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10'>
      <div className='flex w-full max-w-sm flex-col gap-6'>
        <a href='/' className='flex items-center gap-2 self-center font-medium'>
          <div className='bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md'>
            <GalleryVerticalEnd className='size-4' />
          </div>
          Acme Inc.
        </a>
        <Card>
          <CardHeader className='text-center'>
            <CardTitle className='text-xl'>Welcome back</CardTitle>
            <CardDescription>
              Login with your Email and Password
            </CardDescription>
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
                  <FieldLabel htmlFor='email'>Email</FieldLabel>
                  <Input
                    id='email'
                    name='email'
                    type='email'
                    placeholder='m@example.com'
                    required
                    disabled={isSubmitting}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor='password'>Password</FieldLabel>
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
                    {isSubmitting ? 'Signing in...' : 'Login'}
                  </Button>
                  <FieldDescription className='text-center'>
                    Don&apos;t have an account? Contact the administrator
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
