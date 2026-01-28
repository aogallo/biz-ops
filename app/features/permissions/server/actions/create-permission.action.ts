import z from 'zod'
import { requireAuth } from '~/server/auth/session.server'
import { PERMISSION_MESSAGES } from '../../messages'
import { createPermissionSchema } from '../../schemas'
import { permissionsRepository } from '../repository'

export async function createPermission(request: Request) {
  const session = await requireAuth(request)

  // Check super admin
  if (!session.user.isSuperAdmin) {
    return {
      success: false,
      message: PERMISSION_MESSAGES.notSuperAdmin,
    }
  }

  const formData = await request.formData()

  // Parse and validate form data
  const result = createPermissionSchema.safeParse({
    resource: formData.get('resource'),
    action: formData.get('action'),
    description: formData.get('description') || null,
  })

  if (!result.success) {
    return {
      success: false,
      message: 'Validation failed',
      errors: z.flattenError(result.error).fieldErrors,
    }
  }

  // Check for duplicate resource:action
  const exists = await permissionsRepository.existsByResourceAction(
    result.data.resource,
    result.data.action
  )

  if (exists) {
    return {
      success: false,
      message: PERMISSION_MESSAGES.duplicateResourceAction,
    }
  }

  try {
    const permission = await permissionsRepository.create(result.data)
    return {
      success: true,
      data: permission,
    }
  } catch (error) {
    console.error('Error creating permission:', error)
    return {
      success: false,
      message:
        error instanceof Error ? error.message : 'Failed to create permission',
    }
  }
}
