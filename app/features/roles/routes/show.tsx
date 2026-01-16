import { eq, sql } from 'drizzle-orm'
import { Edit, Trash2 } from 'lucide-react'
import {
  Form,
  Link,
  useActionData,
  useLoaderData,
  useNavigation,
} from 'react-router'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '~/components/ui/alert-dialog'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { useCanPerformAction } from '~/hooks/usePermissions'
import { requireAuth } from '~/server/auth/session.server'
import { db } from '~/server/db'
import { memberModel } from '~/server/db/schemas/auth'
import { redirectWithFlash } from '~/server/flash.server'
import { isSuperAdmin } from '~/server/permissions'
import { ROLE_MESSAGES } from '../messages'
import { deleteRole } from '../server/actions/delete.action'
import { rolesRepository } from '../server/repository'
import type { Route } from './+types/show'

export async function loader({ request, params }: Route.LoaderArgs) {
  const session = await requireAuth(request)

  const roleId = params.id
  const role = await rolesRepository.getById(roleId)

  if (!role) {
    return redirectWithFlash('/roles', {
      type: 'error',
      message: ROLE_MESSAGES.notFound,
    })
  }

  const [permissions, memberCount, isSuperAdminUser] = await Promise.all([
    rolesRepository.getRolePermissions(roleId),
    db
      .select({ count: sql<number>`count(*)` })
      .from(memberModel)
      .where(eq(memberModel.roleId, roleId))
      .then((r) => Number(r[0].count)),
    isSuperAdmin(session.user.id),
  ])

  // Group permissions by resource
  const permissionsByResource = permissions.reduce(
    (acc, perm) => {
      if (!acc[perm.resource]) {
        acc[perm.resource] = []
      }
      acc[perm.resource].push(perm)
      return acc
    },
    {} as Record<string, typeof permissions>
  )

  return {
    role,
    permissionsByResource,
    memberCount,
    isSuperAdmin: isSuperAdminUser,
  }
}

export async function action({ request, params }: Route.ActionArgs) {
  const roleId = params.id
  const response = await deleteRole(request, roleId)

  if (response.success) {
    return redirectWithFlash('/roles', {
      type: 'success',
      message: ROLE_MESSAGES.deleted,
    })
  }

  return response
}

export default function ShowRole() {
  const { role, permissionsByResource, memberCount, isSuperAdmin } =
    useLoaderData<typeof loader>()
  const actionData = useActionData<typeof action>()
  const navigation = useNavigation()
  const isDeleting = navigation.state === 'submitting'

  const canEditRole = useCanPerformAction('roles.edit')
  const canDeleteRole = useCanPerformAction('roles.delete')

  // Super admin can edit system roles, but cannot delete them
  const canEdit = canEditRole && (isSuperAdmin || !role.isSystem)
  const canDelete = !role.isSystem && memberCount === 0 && canDeleteRole

  return (
    <div className='mx-auto max-w-4xl p-6'>
      <div className='mb-6 flex items-center justify-between'>
        <div>
          <div className='mb-2 flex items-center gap-3'>
            <h1 className='text-2xl font-bold'>{role.name}</h1>
            <Badge variant={role.isSystem ? 'secondary' : 'default'}>
              {role.isSystem ? 'System' : 'Custom'}
            </Badge>
          </div>
          <p className='text-muted-foreground'>
            {role.description || 'No description'}
          </p>
        </div>
        {(canEdit || canDelete) && (
          <div className='flex gap-2'>
            {canEdit && (
              <Button asChild variant='outline'>
                <Link to={`/roles/${role.id}/edit`}>
                  <Edit className='mr-2 h-4 w-4' />
                  Edit
                </Link>
              </Button>
            )}
            {canDelete && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant='destructive'
                    disabled={!canDelete}
                    title={
                      !canDelete && memberCount > 0
                        ? `Cannot delete: ${memberCount} member(s) assigned`
                        : undefined
                    }
                  >
                    <Trash2 className='mr-2 h-4 w-4' />
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Role?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete the role &quot;{role.name}
                      &quot;. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <Form method='post'>
                      <AlertDialogAction
                        type='submit'
                        disabled={isDeleting}
                        className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
                      >
                        {isDeleting ? 'Deleting...' : 'Delete'}
                      </AlertDialogAction>
                    </Form>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        )}
      </div>

      {actionData?.message && !actionData.success && (
        <div className='bg-destructive/10 text-destructive mb-6 rounded-md p-4 text-sm'>
          {actionData.message}
        </div>
      )}

      {/* Member Count */}
      <div className='mb-6 rounded-lg border p-4'>
        <div className='flex items-center justify-between'>
          <div>
            <h2 className='text-muted-foreground text-sm font-medium'>
              Members with this role
            </h2>
            <p className='text-2xl font-bold'>{memberCount}</p>
          </div>
          {memberCount > 0 && !role.isSystem && (
            <p className='text-muted-foreground text-xs'>
              Reassign members before deleting this role
            </p>
          )}
        </div>
      </div>

      {/* Permissions */}
      <div>
        <h2 className='mb-4 text-lg font-semibold'>Permissions</h2>
        {Object.keys(permissionsByResource).length === 0 ? (
          <div className='rounded-lg border border-dashed p-8 text-center'>
            <p className='text-muted-foreground'>
              No permissions assigned to this role
            </p>
          </div>
        ) : (
          <div className='space-y-4'>
            {Object.entries(permissionsByResource).map(([resource, perms]) => (
              <div key={resource} className='rounded-lg border p-4'>
                <h3 className='mb-3 text-sm font-semibold capitalize'>
                  {resource} ({perms.length})
                </h3>
                <div className='grid gap-2 sm:grid-cols-2'>
                  {perms.map((perm) => (
                    <div key={perm.id} className='flex flex-col'>
                      <span className='text-sm font-medium'>{perm.action}</span>
                      {perm.description && (
                        <span className='text-muted-foreground text-xs'>
                          {perm.description}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
