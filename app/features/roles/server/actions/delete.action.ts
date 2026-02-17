import { getLocaleFromRequest, translateServer } from '~/i18n/translate.server'
import { requireAuth } from '~/server/auth/session.server'
import { isOrgAdmin, isSuperAdmin } from '~/server/permissions'
import { rolesRepository } from '../repository'

export async function deleteRole(request: Request, roleId: string) {
  const session = await requireAuth(request)
  const locale = getLocaleFromRequest(request)

  // Get role
  const role = await rolesRepository.getById(roleId)
  if (!role) {
    return {
      success: false,
      message: translateServer(locale, 'messages.roles.notFound'),
    }
  }

  // Check permissions
  const isSuperAdminUser = await isSuperAdmin(session.user.id)
  const isOrgAdminUser = await isOrgAdmin(session.user.id, role.organizationId)

  if (!isSuperAdminUser && !isOrgAdminUser) {
    return {
      success: false,
      message: translateServer(locale, 'messages.roles.systemRoleProtected'),
    }
  }

  // Check if deletable
  const { canDelete, reason } = await rolesRepository.canDeleteRole(roleId)
  if (!canDelete) {
    return {
      success: false,
      message: reason || translateServer(locale, 'messages.roles.systemRoleProtected'),
    }
  }

  try {
    await rolesRepository.delete(roleId)
    return {
      success: true,
    }
  } catch (error) {
    console.error('Error deleting role:', error)
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to delete role',
    }
  }
}
