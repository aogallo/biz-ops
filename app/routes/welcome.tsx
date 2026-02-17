import { GalleryVerticalEnd, LogOut, Users } from 'lucide-react'
import { Form, redirect } from 'react-router'
import { Button } from '~/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card'
import { useTranslation } from '~/i18n/context'
import { getPostLoginRedirect } from '~/server/auth/access.server'
import { requireAuth } from '~/server/auth/session.server'
import type { Route } from './+types/welcome'

export async function loader({ request }: Route.LoaderArgs) {
  const session = await requireAuth(request)

  // Check if user now has organization memberships
  // If they do, redirect to their first organization
  const redirectUrl = await getPostLoginRedirect(session.user.id)
  if (redirectUrl !== '/welcome') {
    return redirect(redirectUrl)
  }

  return {
    user: {
      name: session.user.name,
      email: session.user.email,
    },
  }
}

export default function WelcomePage({ loaderData }: Route.ComponentProps) {
  const { user } = loaderData
  const { t } = useTranslation()

  return (
    <div className='flex min-h-svh flex-col items-center justify-center bg-muted p-6 md:p-10'>
      <div className='flex w-full max-w-md flex-col gap-6'>
        <a
          href='#'
          className='flex items-center gap-2 self-center font-medium'
        >
          <div className='flex size-6 items-center justify-center rounded-md bg-primary text-primary-foreground'>
            <GalleryVerticalEnd className='size-4' />
          </div>
          {t('welcome.brandName')}
        </a>

        <Card>
          <CardHeader className='text-center'>
            <div className='mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-muted'>
              <Users className='size-8 text-muted-foreground' />
            </div>
            <CardTitle className='text-xl'>
              {t('welcome.title', { name: user.name || 'User' })}
            </CardTitle>
            <CardDescription className='text-base'>
              {t('welcome.noAccess')}
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <p className='text-center text-sm text-muted-foreground'>
              {t('welcome.waitForAdmin')}
            </p>

            <div className='rounded-md bg-muted p-4'>
              <p className='text-sm'>
                <span className='font-medium'>{t('welcome.signedInAs')}</span>
                <br />
                {user.email}
              </p>
            </div>

            <div className='flex flex-col gap-2'>
              <Button
                variant='outline'
                onClick={() => window.location.reload()}
                className='w-full'
              >
                {t('welcome.checkAccess')}
              </Button>

              <Form method='post' action='/logout'>
                <Button
                  type='submit'
                  variant='ghost'
                  className='w-full text-muted-foreground'
                >
                  <LogOut className='mr-2 size-4' />
                  {t('welcome.signOut')}
                </Button>
              </Form>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
