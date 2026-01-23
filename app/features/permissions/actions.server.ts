import { hasPermission } from '~/server/auth/permissions.server'
import { hasRole } from '~/server/auth/roles.server'
import { requireAuth } from '~/server/auth/session.server'

export async function processPermissionFile(request: Request) {
  // Get Authenticated user
  const session = await requireAuth(request)
  const {
    user,
    session: { activeOrganizationId = null },
  } = session

  if (!activeOrganizationId) {
    return { success: false, message: 'Organization is not found.' }
  }

  // Validate super-admin and admin role
  const isValidateRole = await hasRole({
    userId: user.id,
    organizationId: activeOrganizationId,
    roleName: 'super-admin',
  })

  if (!isValidateRole) {
    return {
      success: false,
      message: 'You don"t have permission to perform this action.',
    }
  }

  // Validate permissions permissions:bulk
  const isValidatePermissions =
    !isValidateRole &&
    (await hasPermission(user.id, activeOrganizationId, 'permission:upload'))

  if (!isValidatePermissions) {
    return {
      success: false,
      message: 'You don"t have permission to perform this action.',
    }
  }

  console.log('Start processing file')
  const formData = await request.formData()
  const file = formData.get('permissionFile')
  return {
    success: false,
    message: 'You don"t have permission to perform this action.',
  }
}
