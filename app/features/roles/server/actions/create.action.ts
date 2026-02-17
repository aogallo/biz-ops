import { getLocaleFromRequest, translateServer } from '~/i18n/translate.server'
import { requireAuth } from '~/server/auth/session.server'
import { isOrgAdmin, isSuperAdmin } from '~/server/permissions'
import { createRoleSchema } from '../../schemas'
import { rolesRepository } from '../repository'

const RESERVED_NAMES = ['owner', 'admin', 'member', 'super-admin']

export async function createRole(request: Request) {
  const session = await requireAuth(request)
  const locale = getLocaleFromRequest(request)
  const formData = await request.formData()

  // Get organization ID from session
  const organizationId = session.session.activeOrganizationId
  if (!organizationId) {
    return {
      success: false,
      message: translateServer(locale, 'messages.roles.noOrganization'),
    }
  }

  // Parse and validate input
  const permissionIds = formData.getAll('permissionIds') as string[]
  const inputValues = {
    name: formData.get('name'),
    description: formData.get('description'),
    organizationId,
    permissionIds,
  }

  const result = createRoleSchema.safeParse(inputValues)
  if (!result.success) {
    return {
      success: false,
      message: 'Validation failed',
      errors: result.error.flatten().fieldErrors,
    }
  }

  const { name } = result.data

  // Check permissions
  const isSuperAdminUser = await isSuperAdmin(session.user.id)
  const isOrgAdminUser = await isOrgAdmin(session.user.id, organizationId)

  if (!isSuperAdminUser && !isOrgAdminUser) {
    return {
      success: false,
      message: translateServer(locale, 'messages.roles.systemRoleProtected'),
    }
  }

  // Validate name not reserved
  if (RESERVED_NAMES.includes(name)) {
    return {
      success: false,
      message: translateServer(locale, 'messages.roles.reservedName'),
    }
  }

  // Check name uniqueness
  const exists = await rolesRepository.existsByName(organizationId, name)
  if (exists) {
    return {
      success: false,
      message: translateServer(locale, 'messages.roles.nameExists'),
    }
  }

  try {
    const role = await rolesRepository.create(result.data)
    return {
      success: true,
      data: role,
    }
  } catch (error) {
    console.error('Error creating role:', error)
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to create role',
    }
  }
}
