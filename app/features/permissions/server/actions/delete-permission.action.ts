import { getLocaleFromRequest, translateServer } from '~/i18n/translate.server'
import { requireAuth } from '~/server/auth/session.server'
import { permissionsRepository } from '../repository'

export async function deletePermission(
  request: Request,
  permissionId: string
) {
  const session = await requireAuth(request)
  const locale = getLocaleFromRequest(request)

  // Check super admin
  if (!session.user.isSuperAdmin) {
    return {
      success: false,
      message: translateServer(locale, 'messages.permissions.notSuperAdmin'),
    }
  }

  // Get the permission
  const permission = await permissionsRepository.getById(permissionId)
  if (!permission) {
    return {
      success: false,
      message: translateServer(locale, 'messages.permissions.notFound'),
    }
  }

  // Check if deletable
  const { canDelete, reason } = await permissionsRepository.canDelete(
    permissionId
  )

  if (!canDelete) {
    return {
      success: false,
      message: reason || translateServer(locale, 'messages.permissions.systemPermissionProtected'),
    }
  }

  try {
    await permissionsRepository.delete(permissionId)
    return {
      success: true,
    }
  } catch (error) {
    console.error('Error deleting permission:', error)
    return {
      success: false,
      message:
        error instanceof Error ? error.message : 'Failed to delete permission',
    }
  }
}
