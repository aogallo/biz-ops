import { getLocaleFromRequest, translateServer } from '~/i18n/translate.server'
import { requireAuth } from '~/server/auth/session.server'
import { updatePermissionSchema } from '../../schemas'
import { permissionsRepository } from '../repository'

export async function updatePermission(request: Request, permissionId: string) {
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

  // Check if system permission
  if (permission.isSystem) {
    return {
      success: false,
      message: translateServer(locale, 'messages.permissions.systemPermissionProtected'),
    }
  }

  const formData = await request.formData()

  // Parse and validate form data
  const result = updatePermissionSchema.safeParse({
    resource: formData.get('resource'),
    action: formData.get('action'),
    description: formData.get('description') || null,
  })

  if (!result.success) {
    return {
      success: false,
      message: 'Validation failed',
      errors: result.error.flatten().fieldErrors,
    }
  }

  // Check for duplicate resource:action (excluding current permission)
  if (result.data.resource && result.data.action) {
    const exists = await permissionsRepository.existsByResourceAction(
      result.data.resource,
      result.data.action,
      permissionId
    )

    if (exists) {
      return {
        success: false,
        message: translateServer(locale, 'messages.permissions.duplicateResourceAction'),
      }
    }
  }

  try {
    const updatedPermission = await permissionsRepository.update(
      permissionId,
      result.data
    )
    return {
      success: true,
      data: updatedPermission,
    }
  } catch (error) {
    console.error('Error updating permission:', error)
    return {
      success: false,
      message:
        error instanceof Error ? error.message : 'Failed to update permission',
    }
  }
}
