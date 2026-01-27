import { Link, useSubmit } from 'react-router'
import { Button } from '~/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card'
import { ACCOUNT_MESSAGES } from '~/features/accounts/messages'
import { deleteAccount } from '~/features/accounts/server/actions/delete.action'
import { accountsRepository } from '~/features/accounts/server/repository'
import { requireAuth } from '~/server/auth/session.server'
import { redirectWithFlash } from '~/server/flash.server'
import type { Route } from './+types/show'

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

  const result = await deleteAccount(request, id)

  if (result.success) {
    return redirectWithFlash('/accounts', {
      type: 'success',
      message: ACCOUNT_MESSAGES.deleted,
    })
  }

  return result
}

export default function ShowAccount({ loaderData }: Route.ComponentProps) {
  const { account } = loaderData
  const submit = useSubmit()

  const handleDelete = () => {
    if (
      confirm(
        `Are you sure you want to delete "${account.name}"? This action cannot be undone.`
      )
    ) {
      submit({}, { method: 'post' })
    }
  }

  return (
    <div className='p-6'>
      <div className='mb-6 flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-bold'>Account Details</h1>
          <p className='text-muted-foreground'>
            View and manage account information
          </p>
        </div>
        <div className='flex gap-2'>
          <Link to={`/accounts/${account.id}/edit`}>
            <Button variant='outline'>Edit</Button>
          </Link>
          <Button variant='destructive' onClick={handleDelete}>
            Delete
          </Button>
          <Link to='/accounts'>
            <Button variant='outline'>Back to Accounts</Button>
          </Link>
        </div>
      </div>

      <div className='grid gap-6 md:grid-cols-2'>
        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
            <CardDescription>
              Basic account details
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div>
              <label className='text-muted-foreground text-sm font-medium'>
                Account Number
              </label>
              <p className='font-mono text-lg'>{account.accountNumber}</p>
            </div>
            <div>
              <label className='text-muted-foreground text-sm font-medium'>
                Account Name
              </label>
              <p className='text-lg font-semibold'>{account.name}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Metadata</CardTitle>
            <CardDescription>System information</CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div>
              <label className='text-muted-foreground text-sm font-medium'>
                Account ID
              </label>
              <p className='font-mono text-sm'>{account.id}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
