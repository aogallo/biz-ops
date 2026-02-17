import { Form, Link, useActionData, useLoaderData, useNavigation } from 'react-router'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Textarea } from '~/components/ui/textarea'
import { updatePermission } from '~/features/permissions/server/actions/update-permission.action'
import { permissionsRepository } from '~/features/permissions/server/repository'
import { getLocaleFromRequest, translateServer } from '~/i18n/translate.server'
import { requireAuth } from '~/server/auth/session.server'
import { redirectWithFlash } from '~/server/flash.server'
import type { Route } from './+types/edit'

export async function loader({ request, params }: Route.LoaderArgs) {
  const session = await requireAuth(request)
  const locale = getLocaleFromRequest(request)

  // Check super admin
  if (!session.user.isSuperAdmin) {
    return redirectWithFlash('/permissions', {
      type: 'error',
      message: translateServer(locale, 'messages.permissions.notSuperAdmin'),
    })
  }

  const permissionId = params.id
  const permission = await permissionsRepository.getById(permissionId)

  if (!permission) {
    return redirectWithFlash('/permissions', {
      type: 'error',
      message: translateServer(locale, 'messages.permissions.notFound'),
    })
  }

  // Block editing system permissions
  if (permission.isSystem) {
    return redirectWithFlash('/permissions', {
      type: 'error',
      message: translateServer(locale, 'messages.permissions.systemPermissionProtected'),
    })
  }

  return { permission }
}

export async function action({ request, params }: Route.ActionArgs) {
  const permissionId = params.id
  const locale = getLocaleFromRequest(request)
  const response = await updatePermission(request, permissionId)

  if (response.success && response.data) {
    return redirectWithFlash(`/permissions/${permissionId}`, {
      type: 'success',
      message: translateServer(locale, 'messages.permissions.updated'),
    })
  }

  return response
}

export default function EditPermission() {
  const { permission } = useLoaderData<typeof loader>()
  const actionData = useActionData<typeof action>()
  const navigation = useNavigation()
  const isSubmitting = navigation.state === 'submitting'

  return (
    <div className='mx-auto max-w-3xl p-6'>
      <h1 className='mb-2 text-2xl font-bold'>Edit Permission</h1>
      <p className='text-muted-foreground mb-6'>
        Update permission details
      </p>

      <Form method='post' className='space-y-6'>
        {actionData?.message && !actionData.success && (
          <div className='bg-destructive/10 text-destructive rounded-md p-4 text-sm'>
            {actionData.message}
          </div>
        )}

        <div className='grid gap-4 sm:grid-cols-2'>
          <div className='space-y-2'>
            <Label htmlFor='resource'>Resource *</Label>
            <Input
              type='text'
              id='resource'
              name='resource'
              required
              defaultValue={permission.resource}
              placeholder='e.g., users, invoices, reports'
            />
            {actionData?.errors?.resource && (
              <p className='text-destructive text-xs'>
                {actionData.errors.resource[0]}
              </p>
            )}
            <p className='text-muted-foreground text-xs'>
              Lowercase letters, numbers, hyphens, and underscores only
            </p>
          </div>

          <div className='space-y-2'>
            <Label htmlFor='action'>Action *</Label>
            <Input
              type='text'
              id='action'
              name='action'
              required
              defaultValue={permission.action}
              placeholder='e.g., create, read, update, delete'
            />
            {actionData?.errors?.action && (
              <p className='text-destructive text-xs'>
                {actionData.errors.action[0]}
              </p>
            )}
            <p className='text-muted-foreground text-xs'>
              Lowercase letters, numbers, hyphens, and underscores only
            </p>
          </div>
        </div>

        <div className='space-y-2'>
          <Label htmlFor='description'>Description</Label>
          <Textarea
            id='description'
            name='description'
            rows={3}
            defaultValue={permission.description || ''}
            placeholder='Describe what this permission allows...'
          />
          {actionData?.errors?.description && (
            <p className='text-destructive text-xs'>
              {actionData.errors.description[0]}
            </p>
          )}
        </div>

        <div className='flex gap-3'>
          <Button type='submit' disabled={isSubmitting}>
            {isSubmitting ? 'Updating...' : 'Update Permission'}
          </Button>
          <Button type='button' variant='outline' asChild>
            <Link to={`/permissions/${permission.id}`}>Cancel</Link>
          </Button>
        </div>
      </Form>
    </div>
  )
}
