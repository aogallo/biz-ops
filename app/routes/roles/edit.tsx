import { ChevronDown } from 'lucide-react'
import { useState } from 'react'
import { Form, useActionData, useLoaderData, useNavigation } from 'react-router'
import { Button } from '~/components/ui/button'
import { Checkbox } from '~/components/ui/checkbox'
import { useTranslation } from '~/i18n/context'
import { getLocaleFromRequest, translateServer } from '~/i18n/translate.server'
import { requireAuth } from '~/server/auth/session.server'
import { redirectWithFlash } from '~/server/flash.server'
import { isSuperAdmin } from '~/server/permissions'
import { updateRole } from '../../features/roles/server/actions/update.action'
import { rolesRepository } from '../../features/roles/server/repository'
import type { Route } from './+types/edit'

export async function loader({ request, params }: Route.LoaderArgs) {
  const session = await requireAuth(request)
  const locale = getLocaleFromRequest(request)

  const roleId = params.id
  const role = await rolesRepository.getById(roleId)

  if (!role) {
    return redirectWithFlash('/roles', {
      type: 'error',
      message: translateServer(locale, 'messages.roles.notFound'),
    })
  }

  // Block editing system roles for non-super-admins
  const isSuperAdminUser = await isSuperAdmin(session.user.id)
  if (role.isSystem && !isSuperAdminUser) {
    return redirectWithFlash('/roles', {
      type: 'error',
      message: translateServer(locale, 'messages.roles.systemRoleProtected'),
    })
  }

  const [permissions, currentPermissions] = await Promise.all([
    rolesRepository.getAllPermissions(),
    rolesRepository.getRolePermissions(roleId),
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

  const currentPermissionIds = currentPermissions.map((p) => p.id)

  return {
    role,
    permissionsByResource,
    currentPermissionIds,
  }
}

export async function action({ request, params }: Route.ActionArgs) {
  const roleId = params.id
  const locale = getLocaleFromRequest(request)
  const response = await updateRole(request, roleId)

  if (response.success && response.data) {
    return redirectWithFlash(`/roles/${roleId}`, {
      type: 'success',
      message: translateServer(locale, 'messages.roles.updated'),
    })
  }

  return response
}

function PermissionSection({
  resource,
  perms,
  currentPermissionIds,
}: {
  resource: string
  perms: Array<{ id: string; action: string; description: string | null }>
  currentPermissionIds: string[]
}) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className='border-b last:border-b-0'>
      <button
        type='button'
        onClick={() => setIsOpen(!isOpen)}
        className='hover:bg-accent flex w-full items-center justify-between rounded-md px-3 py-2 text-sm font-medium'
      >
        <span className='capitalize'>
          {resource} ({perms.length})
        </span>
        <ChevronDown
          className={`h-4 w-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>
      <div className={`space-y-2 px-3 py-2 ${isOpen ? '' : 'hidden'}`}>
        {perms.map((perm) => (
          <div key={perm.id} className='flex items-start space-x-3'>
            <Checkbox
              id={perm.id}
              name='permissionIds'
              value={perm.id}
              defaultChecked={currentPermissionIds.includes(perm.id)}
              className='mt-1'
            />
            <label
              htmlFor={perm.id}
              className='flex-1 cursor-pointer text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70'
            >
              <span className='font-medium'>{perm.action}</span>
              {perm.description && (
                <p className='text-muted-foreground mt-1 text-xs'>
                  {perm.description}
                </p>
              )}
            </label>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function EditRole() {
  const { role, permissionsByResource, currentPermissionIds } =
    useLoaderData<typeof loader>()
  const actionData = useActionData<typeof action>()
  const navigation = useNavigation()
  const isSubmitting = navigation.state === 'submitting'
  const { t } = useTranslation()

  return (
    <div className='mx-auto max-w-3xl p-6'>
      <h1 className='mb-2 text-2xl font-bold'>{t('roles.editTitle')}</h1>
      <p className='text-muted-foreground mb-6'>
        {t('roles.editDescription')}
      </p>

      <Form method='post' className='space-y-6'>
        {actionData?.message && !actionData.success && (
          <div className='bg-destructive/10 text-destructive rounded-md p-4 text-sm'>
            {actionData.message}
          </div>
        )}

        <div>
          <label htmlFor='name' className='mb-2 block text-sm font-medium'>
            {t('roles.nameLabel')}
          </label>
          <input
            type='text'
            id='name'
            name='name'
            required
            defaultValue={role.name}
            placeholder={t('roles.namePlaceholder')}
            className='border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none'
          />
          {actionData?.errors?.name && (
            <p className='text-destructive mt-1 text-xs'>
              {actionData.errors.name[0]}
            </p>
          )}
          <p className='text-muted-foreground mt-1 text-xs'>
            {t('roles.nameHelper')}
          </p>
        </div>

        <div>
          <label
            htmlFor='description'
            className='mb-2 block text-sm font-medium'
          >
            {t('roles.descriptionLabel')}
          </label>
          <textarea
            id='description'
            name='description'
            required
            rows={3}
            defaultValue={role.description || ''}
            placeholder={t('roles.descriptionPlaceholder')}
            className='border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none'
          />
          {actionData?.errors?.description && (
            <p className='text-destructive mt-1 text-xs'>
              {actionData.errors.description[0]}
            </p>
          )}
        </div>

        <div>
          <label className='mb-3 block text-sm font-medium'>
            {t('roles.permissionsLabel')}
          </label>
          {actionData?.errors?.permissionIds && (
            <p className='text-destructive mb-2 text-xs'>
              {actionData.errors.permissionIds[0]}
            </p>
          )}
          <div className='rounded-lg border'>
            {Object.entries(permissionsByResource).map(([resource, perms]) => (
              <PermissionSection
                key={resource}
                resource={resource}
                perms={perms}
                currentPermissionIds={currentPermissionIds}
              />
            ))}
          </div>
        </div>

        <div className='flex gap-3'>
          <Button type='submit' disabled={isSubmitting}>
            {isSubmitting ? t('roles.updating') : t('roles.updateRole')}
          </Button>
          <Button type='button' variant='outline' asChild>
            <a href={`/roles/${role.id}`}>{t('common.cancel')}</a>
          </Button>
        </div>
      </Form>
    </div>
  )
}
