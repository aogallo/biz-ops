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
  const isValidatePermissions = await hasPermission(
    user.id,
    activeOrganizationId,
    'permission:upload'
  )

  if (!isValidateRole && !isValidatePermissions) {
    return {
      success: false,
      message: 'You don"t have permission to perform this action.',
    }
  }

  const formData = await request.formData()
  const file = formData.get('permissionFile') as File | null

  if (!file) {
    return {
      success: false,
      message: 'The file ',
    }
  }

  console.info('file....', file)
  const fileName = file.name.toLowerCase()

  if (fileName.endsWith('.xls') || fileName.endsWith('.xlsx')) {
    return {
      success: false,
      message: 'Unsupported file',
    }
  }

  return {
    success: true,
    message: 'Permissions are created',
  }
}
