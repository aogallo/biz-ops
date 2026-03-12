import { Form, redirect, useActionData, useNavigation } from 'react-router'
import { useTranslation } from '~/i18n/context'
import { Button } from '~/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '~/components/ui/card'
import { updateAccount } from '~/features/accounts/server/actions/update.action'
import { accountsRepository } from '~/features/accounts/server/repository'
import { getLocaleFromRequest, translateServer } from '~/i18n/translate.server'
import { requireAuth } from '~/server/auth/session.server'
import { redirectWithFlash } from '~/server/flash.server'
import type { Route } from './+types/edit'

export async function loader({ request, params }: Route.LoaderArgs) {
  const session = await requireAuth(request)
  const locale = getLocaleFromRequest(request)
  const { id } = params

  const organizationId = session.session.activeOrganizationId
  if (!organizationId) {
    return redirectWithFlash('/accounts', {
      type: 'error',
      message: translateServer(locale, 'messages.accounts.noOrganization'),
    })
  }

  const account = await accountsRepository.getByIdForOrganization(
    organizationId,
    id
  )

  if (!account) {
    return redirectWithFlash('/accounts', {
      type: 'error',
      message: translateServer(locale, 'messages.accounts.notFound'),
    })
  }

  return { account }
}

export async function action({ request, params }: Route.ActionArgs) {
  const { id } = params
  const session = await requireAuth(request)
  const organizationId = session.session.activeOrganizationId

  if (!organizationId) {
    return { success: false, message: 'No active organization' }
  }

  const response = await updateAccount(request, id)

  // Redirect on success
  if (response.success && response.data) {
    return redirect(`/accounts/${response.data.id}`)
  }

  return response
}

export default function EditAccount({ loaderData }: Route.ComponentProps) {
  const { account } = loaderData
  const { t } = useTranslation()
  const actionData = useActionData<typeof action>()
  const navigation = useNavigation()
  const isSubmitting = navigation.state === 'submitting'

  return (
    <div className='mx-auto max-w-4xl p-6'>
      <Card>
        <CardHeader>
          <CardTitle>{t('accounts.editTitle')}</CardTitle>
          <CardDescription>{t('accounts.editDescription')}</CardDescription>
        </CardHeader>
        <Form method='post'>
          <CardContent className='space-y-6'>
            {actionData?.message && !actionData.success && (
              <div className='bg-destructive/10 text-destructive rounded-md p-4 text-sm'>
                {actionData.message}
              </div>
            )}

            <div className='grid gap-6 sm:grid-cols-2'>
              <div>
                <label
                  htmlFor='accountNumber'
                  className='mb-2 block text-sm font-medium'
                >
                  {t('accounts.numberLabel')}
                </label>
                <input
                  type='text'
                  id='accountNumber'
                  name='accountNumber'
                  required
                  defaultValue={account.accountNumber ?? ''}
                  placeholder={t('accounts.numberPlaceholder')}
                  className='border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none'
                />
                {actionData &&
                  'errors' in actionData &&
                  actionData.errors?.accountNumber && (
                    <p className='text-destructive mt-1 text-xs'>
                      {actionData.errors.accountNumber}
                    </p>
                  )}
                <p className='text-muted-foreground mt-1 text-xs'>
                  {t('accounts.numberHelper')}
                </p>
              </div>

              <div>
                <label
                  htmlFor='name'
                  className='mb-2 block text-sm font-medium'
                >
                  {t('accounts.nameLabel')}
                </label>
                <input
                  type='text'
                  id='name'
                  name='name'
                  required
                  defaultValue={account.name ?? ''}
                  placeholder={t('accounts.namePlaceholder')}
                  className='border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none'
                />
                {actionData &&
                  'errors' in actionData &&
                  actionData.errors?.name && (
                    <p className='text-destructive mt-1 text-xs'>
                      {actionData.errors.name}
                    </p>
                  )}
              </div>
            </div>
          </CardContent>
          <CardFooter className='flex justify-end gap-3 border-t pt-6'>
            <Button type='button' variant='outline' asChild>
              <a href={`/accounts/${account.id}`}>{t('common.cancel')}</a>
            </Button>
            <Button type='submit' disabled={isSubmitting}>
              {isSubmitting ? t('common.saving') : t('accounts.saveChanges')}
            </Button>
          </CardFooter>
        </Form>
      </Card>
    </div>
  )
}
