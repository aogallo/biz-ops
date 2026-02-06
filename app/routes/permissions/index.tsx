import type { ColumnDef } from '@tanstack/react-table'
import { Link } from 'react-router'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { DataTable } from '~/components/dataTable/DataTable'
import { useToastFromLoader } from '~/hooks/useToastFromLoader'
import { requireAuth } from '~/server/auth/session.server'
import { getFlash } from '~/server/flash.server'
import { permissionsRepository } from '../../features/permissions/server/repository'
import type { Route } from './+types/index'

type Permission = {
  id: string
  resource: string
  action: string
  description: string | null
  isSystem: boolean
}

export async function loader({ request }: Route.LoaderArgs) {
  const session = await requireAuth(request)
  const { flash } = getFlash(request)

  const permissions = await permissionsRepository.getAll()

  return {
    permissions,
    isSuperAdmin: session.user.isSuperAdmin,
    toast: flash,
  }
}

export default function PermissionsIndex({ loaderData }: Route.ComponentProps) {
  const { permissions, isSuperAdmin, toast } = loaderData

  useToastFromLoader(toast)

  const columns: ColumnDef<Permission>[] = [
    {
      accessorKey: 'resource',
      header: 'Resource',
      cell: ({ row }) => (
        <span className='font-medium'>{row.getValue('resource')}</span>
      ),
    },
    {
      accessorKey: 'action',
      header: 'Action',
    },
    {
      accessorKey: 'description',
      header: 'Description',
      cell: ({ row }) => (
        <span className='text-muted-foreground'>
          {row.getValue('description') || 'No description'}
        </span>
      ),
    },
    {
      accessorKey: 'isSystem',
      header: 'Type',
      cell: ({ row }) => (
        row.getValue('isSystem') ? (
          <Badge variant='secondary'>System</Badge>
        ) : (
          <Badge>Custom</Badge>
        )
      ),
      filterFn: (row, id, value) => {
        return value === undefined || row.getValue(id) === value
      },
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => {
        const permission = row.original
        return (
          <div className='flex gap-2'>
            {isSuperAdmin && !permission.isSystem && (
              <Link
                to={`/permissions/${permission.id}/edit`}
                className='text-primary text-sm font-medium hover:underline'
              >
                Edit
              </Link>
            )}
            <Link
              to={`/permissions/${permission.id}`}
              className='text-primary text-sm font-medium hover:underline'
            >
              View
            </Link>
          </div>
        )
      },
    },
  ]

  return (
    <div className='p-6'>
      <div className='mb-6 flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-bold'>Permissions Management</h1>
          <p className='text-muted-foreground'>
            Configure granular access control lists. Define resources and
            actions.
          </p>
        </div>
        {isSuperAdmin && (
          <Link to='/permissions/new'>
            <Button>Create Permission</Button>
          </Link>
        )}
      </div>

      {permissions.length > 0 ? (
        <DataTable
          columns={columns}
          data={permissions}
          enableSearch
          searchPlaceholder='Search permissions...'
        />
      ) : (
        <div className='rounded-lg border border-dashed p-8 text-center'>
          <p className='text-muted-foreground mb-4'>
            No permissions found. Create your first permission to get started.
          </p>
          {isSuperAdmin && (
            <Link to='/permissions/new'>
              <Button>Create Permission</Button>
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
