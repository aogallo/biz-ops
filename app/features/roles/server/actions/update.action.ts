import { getLocaleFromRequest, translateServer } from '~/i18n/translate.server'
import { requireAuth } from '~/server/auth/session.server'
import { isOrgAdmin, isSuperAdmin } from '~/server/permissions'
import { updateRoleSchema } from '../../schemas'
import { rolesRepository } from '../repository'

export async function updateRole(request: Request, roleId: string) {
  const session = await requireAuth(request)
  const locale = getLocaleFromRequest(request)
  const formData = await request.formData()

  // Get role
  const role = await rolesRepository.getById(roleId)
  if (!role) {
    return {
      success: false,
      message: translateServer(locale, 'messages.roles.notFound'),
    }
  }

  // Check permissions first
  const isSuperAdminUser = await isSuperAdmin(session.user.id)
  const isOrgAdminUser = await isOrgAdmin(session.user.id, role.organizationId)

  if (!isSuperAdminUser && !isOrgAdminUser) {
    return {
      success: false,
      message: translateServer(locale, 'messages.roles.systemRoleProtected'),
    }
  }

  // Block non-super-admins from editing system roles
  if (role.isSystem && !isSuperAdminUser) {
    return {
      success: false,
      message: translateServer(locale, 'messages.roles.systemRoleProtected'),
    }
  }

  // Parse and validate input
  const permissionIds = formData.getAll('permissionIds') as string[]
  const inputValues = {
    name: formData.get('name'),
    description: formData.get('description'),
    organizationId: role.organizationId,
    permissionIds,
  }

  const result = updateRoleSchema.safeParse(inputValues)
  if (!result.success) {
    return {
      success: false,
      message: 'Validation failed',
      errors: result.error.flatten().fieldErrors,
    }
  }

  const { name, description } = result.data

  // Check name uniqueness (excluding current role)
  if (name) {
    const exists = await rolesRepository.existsByName(
      role.organizationId,
      name,
      roleId
    )
    if (exists) {
      return {
        success: false,
        message: translateServer(locale, 'messages.roles.nameExists'),
      }
    }
  }

  try {
    // Update role
    await rolesRepository.update(roleId, { name, description })

    // Update permissions
    await rolesRepository.assignPermissions(
      roleId,
      result.data.permissionIds,
      role.organizationId
    )

    return {
      success: true,
      data: { roleId },
    }
  } catch (error) {
    console.error('Error updating role:', error)
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to update role',
    }
  }
}
