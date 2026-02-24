import { useEffect } from 'react'
import {
  Form,
  Link,
  redirect,
  useActionData,
  useNavigation,
} from 'react-router'
import { toast } from 'sonner'
import { Button } from '~/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '~/components/ui/card'
import { useTranslation } from '~/i18n/context'
import { createCompany } from '~/features/company/server/actions/create.action.server'
import type { Route } from './+types/create'

export async function action({ request }: Route.ActionArgs) {
  const response = await createCompany(request)
  if (response.success && response.data) {
    return redirect(`/company/${response.data.id}`)
  }
  return response
}

export default function CreateCompany() {
  const actionData = useActionData<typeof action>()
  const navigation = useNavigation()
  const isSubmitting = navigation.state === 'submitting'
  const { t } = useTranslation()

  useEffect(() => {
    if (actionData?.message && !actionData.success) {
      toast.error(actionData.message)
    }
  }, [actionData])

  return (
    <div className='mx-auto max-w-4xl p-6'>
      <Card>
        <CardHeader>
          <CardTitle>{t('company.createTitle')}</CardTitle>
          <CardDescription>
            {t('company.createDescription')}
          </CardDescription>
        </CardHeader>
        <Form method='post'>
          <CardContent className='space-y-6'>
            <div className='grid gap-6 sm:grid-cols-2'>
              <div>
                <label htmlFor='name' className='mb-2 block text-sm font-medium'>
                  {t('company.nameLabel')}
                </label>
                <input
                  type='text'
                  id='name'
                  name='name'
                  required
                  placeholder='Acme Corporation'
                  className='border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none'
                />
                {actionData?.errors?.name && (
                  <p className='text-destructive mt-1 text-xs'>
                    {actionData.errors.name}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor='nit' className='mb-2 block text-sm font-medium'>
                  {t('company.nitLabel')}
                </label>
                <input
                  type='text'
                  id='nit'
                  name='nit'
                  required
                  placeholder='Nit'
                  className='border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none'
                />
                {actionData?.errors?.nit && (
                  <p className='text-destructive mt-1 text-xs'>
                    {actionData.errors.nit}
                  </p>
                )}
              </div>
            </div>

              <div>
                <label
                  htmlFor='code'
                  className='mb-2 block text-sm font-medium'
                >
                  POS Code{' '}
                  <span className='text-muted-foreground font-normal'>
                    (optional)
                  </span>
                </label>
                <input
                  type='text'
                  id='code'
                  name='code'
                  maxLength={20}
                  placeholder='TIENDA-01'
                  className='border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring w-full rounded-md border px-3 py-2 text-sm uppercase focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none'
                  style={{ textTransform: 'uppercase' }}
                />
                {actionData?.errors?.code && (
                  <p className='text-destructive mt-1 text-xs'>
                    {actionData.errors.code}
                  </p>
                )}
                <p className='text-muted-foreground mt-1 text-xs'>
                  Short code cashiers type at POS login to identify this
                  company.
                </p>
              </div>

            <div>
              <label htmlFor='email' className='mb-2 block text-sm font-medium'>
                {t('company.emailLabel')}
              </label>
              <input
                type='email'
                id='email'
                name='email'
                placeholder={t('company.emailPlaceholder')}
                className='border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none sm:max-w-md'
              />
              {actionData?.errors?.email && (
                <p className='text-destructive mt-1 text-xs'>
                  {actionData.errors.email}
                </p>
              )}
              <p className='text-muted-foreground mt-1 text-xs'>
                {t('company.emailHelper')}
              </p>
            </div>
          </CardContent>
          <CardFooter className='flex justify-end gap-3 border-t pt-6'>
            <Button type='button' variant='outline' asChild>
              <Link to='/company'>{t('common.cancel')}</Link>
            </Button>
            <Button type='submit' disabled={isSubmitting}>
              {isSubmitting ? t('common.creating') : t('company.createButton')}
            </Button>
          </CardFooter>
        </Form>
      </Card>
    </div>
  )
}
