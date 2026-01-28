import { Form, redirect, useActionData, useNavigation } from 'react-router'
import { Button } from '~/components/ui/button'
import { createAccount } from '~/features/accounts/server/actions/create.action'
import { requireAuth } from '~/server/auth/session.server'
import type { Route } from './+types/create'

export async function loader({ request }: Route.LoaderArgs) {
  // Action handles auth, but loader ensures page is protected
  await requireAuth(request)
  return {}
}

export async function action({ request }: Route.ActionArgs) {
  const response = await createAccount(request)

  // Redirect on success
  if (response.success && response.data) {
    return redirect(`/accounts/${response.data.id}`)
  }

  return response
}

export default function CreateAccount() {
  const actionData = useActionData<typeof action>()
  const navigation = useNavigation()
  const isSubmitting = navigation.state === 'submitting'

  return (
    <div className='mx-auto max-w-2xl p-6'>
      <h1 className='mb-6 text-2xl font-bold'>Create New Account</h1>

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
            placeholder='1000'
            className='border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none'
          />
          {actionData?.errors?.accountNumber && (
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
            placeholder='Cash'
            className='border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none'
          />
          {actionData?.errors?.name && (
            <p className='text-destructive mt-1 text-xs'>
              {actionData.errors.name}
            </p>
          )}
        </div>

        <div className='flex gap-3'>
          <Button type='submit' disabled={isSubmitting}>
            {isSubmitting ? 'Creating...' : 'Create Account'}
          </Button>
          <Button type='button' variant='outline' asChild>
            <a href='/accounts'>Cancel</a>
          </Button>
        </div>
      </Form>
    </div>
  )
}
