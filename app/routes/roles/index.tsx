import type { ColumnDef } from '@tanstack/react-table'
import { useMemo } from 'react'
import { Link } from 'react-router'
import { DataTable } from '~/components/dataTable/DataTable'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { useCanPerformAction } from '~/hooks/usePermissions'
import { useToastFromLoader } from '~/hooks/useToastFromLoader'
import { requireAuth } from '~/server/auth/session.server'
import { getFlash } from '~/server/flash.server'
import { rolesRepository } from '../../features/roles/server/repository'
import type { Route } from './+types/index'

type Role = Awaited<ReturnType<typeof rolesRepository.getAllByOrganization>>[number]

export async function loader({ request }: Route.LoaderArgs) {
  const session = await requireAuth(request)

  const { flash } = getFlash(request)

  const organizationId = session.session.activeOrganizationId
  if (!organizationId) {
    return {
      roles: [],
      noOrganization: true,
      toast: flash,
    }
  }

  const roles = await rolesRepository.getAllByOrganization(organizationId)

  return {
    roles,
    noOrganization: false,
    toast: flash,
  }
}

export default function RolesIndex({ loaderData }: Route.ComponentProps) {
  const { roles, noOrganization, toast } = loaderData
  const canCreateRole = useCanPerformAction('roles.create')
  const canEditRole = useCanPerformAction('roles.edit')

  useToastFromLoader(toast)

  const columns = useMemo<ColumnDef<Role>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Name',
        cell: ({ row }) => (
          <span className="font-medium">{row.getValue('name')}</span>
        ),
      },
      {
        accessorKey: 'description',
        header: 'Description',
        cell: ({ row }) => (
          <span className="text-muted-foreground">
            {row.getValue('description') || 'No description'}
          </span>
        ),
      },
      {
        accessorKey: 'isSystem',
        header: 'Type',
        cell: ({ row }) => {
          const isSystem = row.getValue('isSystem') as boolean
          return isSystem ? (
            <Badge variant="secondary">System</Badge>
          ) : (
            <Badge>Custom</Badge>
          )
        },
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => {
          const isSystem = row.original.isSystem
          return (
            <div className="flex gap-2">
              {!isSystem && canEditRole && (
                <Link
                  to={`/roles/${row.original.id}/edit`}
                  className="text-primary text-sm font-medium hover:underline"
                >
                  Edit
                </Link>
              )}
              <Link
                to={`/roles/${row.original.id}`}
                className="text-primary text-sm font-medium hover:underline"
              >
                View
              </Link>
            </div>
          )
        },
      },
    ],
    [canEditRole]
  )

  if (noOrganization) {
    return (
      <div className='p-6'>
        <div className='rounded-lg border border-dashed p-8 text-center'>
          <p className='text-muted-foreground mb-4'>
            Please select an organization to view roles.
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
          <h1 className='text-2xl font-bold'>Roles & Permissions</h1>
          <p className='text-muted-foreground'>
            Manage roles and their associated permissions
          </p>
        </div>
        <div className='flex gap-2'>
          {canCreateRole && (
            <Link to='/roles/new'>
              <Button className='cursor-pointer'>Create Role</Button>
            </Link>
          )}
          <Link to='/roles/assign'>
            <Button className='cursor-pointer' variant='ghost'>
              Assign Role
            </Button>
          </Link>
        </div>
      </div>

      {roles.length === 0 ? (
        <div className='rounded-lg border border-dashed p-8 text-center'>
          <p className='text-muted-foreground mb-4'>
            No roles found. Create your first role to get started.
          </p>
          {canCreateRole && (
            <Link to='/roles/new'>
              <Button>Create Role</Button>
            </Link>
          )}
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={roles}
          enableSearch
          searchPlaceholder="Search roles..."
        />
      )}
    </div>
  )
}
