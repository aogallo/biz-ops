import { Form, redirect, useActionData, useNavigation } from 'react-router'
import { Button } from '~/components/ui/button'
import { ACCOUNT_MESSAGES } from '~/features/accounts/messages'
import { updateAccount } from '~/features/accounts/server/actions/update.action'
import { accountsRepository } from '~/features/accounts/server/repository'
import { requireAuth } from '~/server/auth/session.server'
import { redirectWithFlash } from '~/server/flash.server'
import type { Route } from './+types/edit'

export async function loader({ request, params }: Route.LoaderArgs) {
  const session = await requireAuth(request)
  const { id } = params

  const organizationId = session.session.activeOrganizationId
  if (!organizationId) {
    return redirectWithFlash('/accounts', {
      type: 'error',
      message: ACCOUNT_MESSAGES.noOrganization,
    })
  }

  const account = await accountsRepository.getByIdForOrganization(
    organizationId,
    id
  )

  if (!account) {
    return redirectWithFlash('/accounts', {
      type: 'error',
      message: ACCOUNT_MESSAGES.notFound,
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
  const actionData = useActionData<typeof action>()
  const navigation = useNavigation()
  const isSubmitting = navigation.state === 'submitting'

  return (
    <div className='mx-auto max-w-2xl p-6'>
      <h1 className='mb-6 text-2xl font-bold'>Edit Account</h1>

      <Form method='post' className='space-y-6'>
        {actionData?.message && !actionData.success && (
          <div className='bg-destructive/10 text-destructive rounded-md p-4 text-sm'>
            {actionData.message}
          </div>
        )}

        <div>
          <label
            htmlFor='accountNumber'
            className='mb-2 block text-sm font-medium'
          >
            Account Number *
          </label>
          <input
            type='text'
            id='accountNumber'
            name='accountNumber'
            required
            defaultValue={account.accountNumber ?? ''}
            placeholder='1000'
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
            Unique identifier for this account in your chart of accounts
          </p>
        </div>

        <div>
          <label htmlFor='name' className='mb-2 block text-sm font-medium'>
            Account Name *
          </label>
          <input
            type='text'
            id='name'
            name='name'
            required
            defaultValue={account.name ?? ''}
            placeholder='Cash'
            className='border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none'
          />
          {actionData && 'errors' in actionData && actionData.errors?.name && (
            <p className='text-destructive mt-1 text-xs'>
              {actionData.errors.name}
            </p>
          )}
        </div>

        <div className='flex gap-3'>
          <Button type='submit' disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </Button>
          <Button type='button' variant='outline' asChild>
            <a href={`/accounts/${account.id}`}>Cancel</a>
          </Button>
        </div>
      </Form>
    </div>
  )
}
