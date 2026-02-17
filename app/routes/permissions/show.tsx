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
import { deletePermission } from '~/features/permissions/server/actions/delete-permission.action'
import { permissionsRepository } from '~/features/permissions/server/repository'
import { getLocaleFromRequest, translateServer } from '~/i18n/translate.server'
import { requireAuth } from '~/server/auth/session.server'
import { redirectWithFlash } from '~/server/flash.server'
import type { Route } from './+types/show'

export async function loader({ request, params }: Route.LoaderArgs) {
  const session = await requireAuth(request)
  const locale = getLocaleFromRequest(request)

  const permissionId = params.id
  const permission = await permissionsRepository.getById(permissionId)

  if (!permission) {
    return redirectWithFlash('/permissions', {
      type: 'error',
      message: translateServer(locale, 'messages.permissions.notFound'),
    })
  }

  const roleCount = await permissionsRepository.getRoleCount(permissionId)

  return {
    permission,
    roleCount,
    isSuperAdmin: session.user.isSuperAdmin,
  }
}

export async function action({ request, params }: Route.ActionArgs) {
  const permissionId = params.id
  const locale = getLocaleFromRequest(request)
  const response = await deletePermission(request, permissionId)

  if (response.success) {
    return redirectWithFlash('/permissions', {
      type: 'success',
      message: translateServer(locale, 'messages.permissions.deleted'),
    })
  }

  return response
}

export default function ShowPermission() {
  const { permission, roleCount, isSuperAdmin } =
    useLoaderData<typeof loader>()
  const actionData = useActionData<typeof action>()
  const navigation = useNavigation()
  const isDeleting = navigation.state === 'submitting'

  // Super admin can edit custom permissions, but cannot edit or delete system permissions
  const canEdit = isSuperAdmin && !permission.isSystem
  const canDelete = isSuperAdmin && !permission.isSystem && roleCount === 0

  return (
    <div className='mx-auto max-w-4xl p-6'>
      <div className='mb-6 flex items-center justify-between'>
        <div>
          <div className='mb-2 flex items-center gap-3'>
            <h1 className='text-2xl font-bold'>
              {permission.resource}:{permission.action}
            </h1>
            <Badge variant={permission.isSystem ? 'secondary' : 'default'}>
              {permission.isSystem ? 'System' : 'Custom'}
            </Badge>
          </div>
          <p className='text-muted-foreground'>
            {permission.description || 'No description'}
          </p>
        </div>
        {(canEdit || canDelete) && (
          <div className='flex gap-2'>
            {canEdit && (
              <Button asChild variant='outline'>
                <Link to={`/permissions/${permission.id}/edit`}>
                  <Edit className='mr-2 h-4 w-4' />
                  Edit
                </Link>
              </Button>
            )}
            {canDelete && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant='destructive'>
                    <Trash2 className='mr-2 h-4 w-4' />
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Permission?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete the permission &quot;
                      {permission.resource}:{permission.action}&quot;. This
                      action cannot be undone.
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

      {/* Permission Details */}
      <div className='mb-6 rounded-lg border'>
        <div className='grid gap-4 p-4 sm:grid-cols-2'>
          <div>
            <h3 className='text-muted-foreground mb-1 text-sm font-medium'>
              Resource
            </h3>
            <p className='font-mono text-sm'>{permission.resource}</p>
          </div>
          <div>
            <h3 className='text-muted-foreground mb-1 text-sm font-medium'>
              Action
            </h3>
            <p className='font-mono text-sm'>{permission.action}</p>
          </div>
          <div className='sm:col-span-2'>
            <h3 className='text-muted-foreground mb-1 text-sm font-medium'>
              Description
            </h3>
            <p className='text-sm'>
              {permission.description || 'No description provided'}
            </p>
          </div>
          <div>
            <h3 className='text-muted-foreground mb-1 text-sm font-medium'>
              Type
            </h3>
            <Badge variant={permission.isSystem ? 'secondary' : 'default'}>
              {permission.isSystem ? 'System' : 'Custom'}
            </Badge>
          </div>
          <div>
            <h3 className='text-muted-foreground mb-1 text-sm font-medium'>
              Created
            </h3>
            <p className='text-sm'>
              {new Date(permission.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>

      {/* Role Usage */}
      <div className='rounded-lg border p-4'>
        <div className='flex items-center justify-between'>
          <div>
            <h2 className='text-muted-foreground text-sm font-medium'>
              Roles using this permission
            </h2>
            <p className='text-2xl font-bold'>{roleCount}</p>
          </div>
          {roleCount > 0 && !permission.isSystem && (
            <p className='text-muted-foreground text-xs'>
              Remove from all roles before deleting
            </p>
          )}
        </div>
      </div>

      {/* Back Link */}
      <div className='mt-6'>
        <Link
          to='/permissions'
          className='text-primary text-sm hover:underline'
        >
          &larr; Back to permissions
        </Link>
      </div>
    </div>
  )
}
