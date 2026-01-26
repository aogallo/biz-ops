import { Link } from 'react-router'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '~/components/ui/table'
import { useCanPerformAction } from '~/hooks/usePermissions'
import { useToastFromLoader } from '~/hooks/useToastFromLoader'
import { requireAuth } from '~/server/auth/session.server'
import { getFlash } from '~/server/flash.server'
import { rolesRepository } from '../../features/roles/server/repository'
import type { Route } from './+types/index'

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

  const systemRoles = roles.filter((role) => role.isSystem)
  const customRoles = roles.filter((role) => !role.isSystem)

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

      {/* System Roles Section */}
      <div className='mb-8'>
        <div className='mb-4'>
          <h2 className='text-lg font-semibold'>System Roles</h2>
          <p className='text-muted-foreground text-sm'>
            Default roles that cannot be modified or deleted
          </p>
        </div>
        <div className='rounded-lg border'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Type</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {systemRoles.map((role) => (
                <TableRow key={role.id}>
                  <TableCell className='font-medium'>{role.name}</TableCell>
                  <TableCell className='text-muted-foreground'>
                    {role.description || 'No description'}
                  </TableCell>
                  <TableCell>
                    <Badge variant='secondary'>System</Badge>
                  </TableCell>
                  <TableCell>
                    <Link
                      to={`/roles/${role.id}`}
                      className='text-primary text-sm font-medium hover:underline'
                    >
                      View →
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Custom Roles Section */}
      <div>
        <div className='mb-4'>
          <h2 className='text-lg font-semibold'>Custom Roles</h2>
          <p className='text-muted-foreground text-sm'>
            Roles created for your organization
          </p>
        </div>
        {customRoles.length === 0 ? (
          <div className='rounded-lg border border-dashed p-8 text-center'>
            <p className='text-muted-foreground mb-4'>
              No custom roles found. Create your first role to get started.
            </p>
            {canCreateRole && (
              <Link to='/roles/new'>
                <Button>Create Role</Button>
              </Link>
            )}
          </div>
        ) : (
          <div className='rounded-lg border'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customRoles.map((role) => (
                  <TableRow key={role.id}>
                    <TableCell className='font-medium'>{role.name}</TableCell>
                    <TableCell className='text-muted-foreground'>
                      {role.description || 'No description'}
                    </TableCell>
                    <TableCell>
                      <Badge>Custom</Badge>
                    </TableCell>
                    <TableCell className='flex gap-2'>
                      {canEditRole && (
                        <Link
                          to={`/roles/${role.id}/edit`}
                          className='text-primary text-sm font-medium hover:underline'
                        >
                          Edit
                        </Link>
                      )}
                      <Link
                        to={`/roles/${role.id}`}
                        className='text-primary text-sm font-medium hover:underline'
                      >
                        View →
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  )
}
