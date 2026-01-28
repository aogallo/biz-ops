import type { ColumnDef } from '@tanstack/react-table'
import { useMemo } from 'react'
import { Link } from 'react-router'
import { DataTable } from '~/components/dataTable/DataTable'
import { Button } from '~/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card'
import { UploadDropzone } from '~/features/accounts/components/UploadDropzone'
import { bulkUploadAccounts } from '~/features/accounts/server/actions/bulk-upload.action'
import { accountsRepository } from '~/features/accounts/server/repository'
import { useToastFromLoader } from '~/hooks/useToastFromLoader'
import { requireAuth } from '~/server/auth/session.server'
import { getFlash } from '~/server/flash.server'
import type { Route } from './+types/index'

type Account = Awaited<
  ReturnType<typeof accountsRepository.getAllByOrganization>
>[number]

export async function action({ request }: Route.ActionArgs) {
  const session = await requireAuth(request)
  const organizationId = session.session.activeOrganizationId

  if (!organizationId) {
    return { success: false, message: 'No active organization selected' }
  }

  const formData = await request.formData()
  const actionType = formData.get('_action')

  if (actionType === 'bulk-upload') {
    return bulkUploadAccounts(organizationId, formData)
  }

  return { success: false, message: 'Unknown action' }
}

export async function loader({ request }: Route.LoaderArgs) {
  const session = await requireAuth(request)

  // Get flash message and headers to clear it
  const { flash } = getFlash(request)

  const organizationId = session.session.activeOrganizationId
  if (!organizationId) {
    return {
      accounts: [],
      noOrganization: true,
      toast: flash,
    }
  }

  const accounts = await accountsRepository.getAllByOrganization(organizationId)

  return {
    accounts,
    noOrganization: false,
    toast: flash,
  }
}

export default function AccountsIndex({ loaderData }: Route.ComponentProps) {
  const { accounts, noOrganization, toast } = loaderData

  // Show toast if present in loader data
  useToastFromLoader(toast)

  const columns = useMemo<ColumnDef<Account>[]>(
    () => [
      {
        accessorKey: 'accountNumber',
        header: 'Account Number',
        cell: ({ row }) => (
          <span className="font-mono text-sm">
            {row.getValue('accountNumber')}
          </span>
        ),
      },
      {
        accessorKey: 'name',
        header: 'Name',
        cell: ({ row }) => (
          <span className="font-medium">{row.getValue('name')}</span>
        ),
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <Link
            to={`/accounts/${row.original.id}`}
            className="text-primary text-sm font-medium hover:underline"
          >
            View
          </Link>
        ),
      },
    ],
    []
  )

  if (noOrganization) {
    return (
      <div className='p-6'>
        <div className='rounded-lg border border-dashed p-8 text-center'>
          <p className='text-muted-foreground mb-4'>
            Please select an organization to view accounts.
          </p>
          <Link to='/organization'>
            <Button>Select Organization</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className='p-6'>
      <div className='mb-6 flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-bold'>Accounts</h1>
          <p className='text-muted-foreground'>Manage your chart of accounts</p>
        </div>
        <Link to='/accounts/new'>
          <Button>Add Account</Button>
        </Link>
      </div>

      <div className='grid gap-6 lg:grid-cols-3'>
        <div className='lg:col-span-2'>
          {accounts.length === 0 ? (
            <div className='rounded-lg border border-dashed p-8 text-center'>
              <p className='text-muted-foreground mb-4'>
                No accounts found. Create your first account to get started.
              </p>
              <Link to='/accounts/new'>
                <Button>Create Account</Button>
              </Link>
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={accounts}
              enableSearch
              searchPlaceholder="Search accounts..."
            />
          )}
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Bulk Import</CardTitle>
              <CardDescription>
                Upload a CSV or Excel file to import multiple accounts at once
              </CardDescription>
            </CardHeader>
            <CardContent>
              <UploadDropzone />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
