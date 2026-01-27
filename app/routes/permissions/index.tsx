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
import { useToastFromLoader } from '~/hooks/useToastFromLoader'
import { requireAuth } from '~/server/auth/session.server'
import { getFlash } from '~/server/flash.server'
import { permissionsRepository } from '../../features/permissions/server/repository'
import type { Route } from './+types/index'

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

  const systemPermissions = permissions.filter((p) => p.isSystem)
  const customPermissions = permissions.filter((p) => !p.isSystem)

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

      {/* System Permissions Section */}
      <div className='mb-8'>
        <div className='mb-4'>
          <h2 className='text-lg font-semibold'>System Permissions</h2>
          <p className='text-muted-foreground text-sm'>
            Default permissions that cannot be modified or deleted
          </p>
        </div>
        {systemPermissions.length === 0 ? (
          <div className='rounded-lg border border-dashed p-8 text-center'>
            <p className='text-muted-foreground'>No system permissions found.</p>
          </div>
        ) : (
          <div className='rounded-lg border'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Resource</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {systemPermissions.map((permission) => (
                  <TableRow key={permission.id}>
                    <TableCell className='font-medium'>
                      {permission.resource}
                    </TableCell>
                    <TableCell>{permission.action}</TableCell>
                    <TableCell className='text-muted-foreground'>
                      {permission.description || 'No description'}
                    </TableCell>
                    <TableCell>
                      <Badge variant='secondary'>System</Badge>
                    </TableCell>
                    <TableCell>
                      <Link
                        to={`/permissions/${permission.id}`}
                        className='text-primary text-sm font-medium hover:underline'
                      >
                        View
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Custom Permissions Section */}
      <div>
        <div className='mb-4'>
          <h2 className='text-lg font-semibold'>Custom Permissions</h2>
          <p className='text-muted-foreground text-sm'>
            Permissions created by administrators
          </p>
        </div>
        {customPermissions.length === 0 ? (
          <div className='rounded-lg border border-dashed p-8 text-center'>
            <p className='text-muted-foreground mb-4'>
              No custom permissions found. Create your first permission to get
              started.
            </p>
            {isSuperAdmin && (
              <Link to='/permissions/new'>
                <Button>Create Permission</Button>
              </Link>
            )}
          </div>
        ) : (
          <div className='rounded-lg border'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Resource</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customPermissions.map((permission) => (
                  <TableRow key={permission.id}>
                    <TableCell className='font-medium'>
                      {permission.resource}
                    </TableCell>
                    <TableCell>{permission.action}</TableCell>
                    <TableCell className='text-muted-foreground'>
                      {permission.description || 'No description'}
                    </TableCell>
                    <TableCell>
                      <Badge>Custom</Badge>
                    </TableCell>
                    <TableCell className='flex gap-2'>
                      {isSuperAdmin && (
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
