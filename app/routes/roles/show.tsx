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
import { useTranslation } from '~/i18n/context'
import { requireAuth } from '~/server/auth/session.server'
import { db } from '~/server/db'
import { memberRoleModel } from '~/server/db/schemas/auth'
import { getLocaleFromRequest, translateServer } from '~/i18n/translate.server'
import { redirectWithFlash } from '~/server/flash.server'
import { isSuperAdmin } from '~/server/permissions'
import { deleteRole } from '../../features/roles/server/actions/delete.action'
import { rolesRepository } from '../../features/roles/server/repository'
import type { Route } from './+types/show'

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

  const [permissions, memberCount, isSuperAdminUser] = await Promise.all([
    rolesRepository.getRolePermissions(roleId),
    db
      .select({ count: sql<number>`count(*)` })
      .from(memberRoleModel)
      .where(eq(memberRoleModel.roleId, roleId))
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
  const locale = getLocaleFromRequest(request)
  const response = await deleteRole(request, roleId)

  if (response.success) {
    return redirectWithFlash('/roles', {
      type: 'success',
      message: translateServer(locale, 'messages.roles.deleted'),
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
  const { t } = useTranslation()

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
              {role.isSystem ? t('common.system') : t('common.custom')}
            </Badge>
          </div>
          <p className='text-muted-foreground'>
            {role.description || t('common.noDescription')}
          </p>
        </div>
        {(canEdit || canDelete) && (
          <div className='flex gap-2'>
            {canEdit && (
              <Button asChild variant='outline'>
                <Link to={`/roles/${role.id}/edit`}>
                  <Edit className='mr-2 h-4 w-4' />
                  {t('common.edit')}
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
                        ? t('roles.reassignMembers')
                        : undefined
                    }
                  >
                    <Trash2 className='mr-2 h-4 w-4' />
                    {t('common.delete')}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      {t('roles.deleteConfirm')}
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      {t('roles.deleteWarning')} &quot;{role.name}
                      &quot;. {t('roles.deleteIrreversible')}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                    <Form method='post'>
                      <AlertDialogAction
                        type='submit'
                        disabled={isDeleting}
                        className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
                      >
                        {isDeleting ? t('roles.deleting') : t('common.delete')}
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
              {t('roles.members')}
            </h2>
            <p className='text-2xl font-bold'>{memberCount}</p>
          </div>
          {memberCount > 0 && !role.isSystem && (
            <p className='text-muted-foreground text-xs'>
              {t('roles.reassignMembers')}
            </p>
          )}
        </div>
      </div>

      {/* Permissions */}
      <div>
        <h2 className='mb-4 text-lg font-semibold'>{t('roles.permissions')}</h2>
        {Object.keys(permissionsByResource).length === 0 ? (
          <div className='rounded-lg border border-dashed p-8 text-center'>
            <p className='text-muted-foreground'>{t('roles.noPermissions')}</p>
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
