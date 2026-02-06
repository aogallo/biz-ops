import { and, eq } from 'drizzle-orm'
import { hasPermission } from '~/server/auth/permissions.server'
import { hasRole } from '~/server/auth/roles.server'
import { requireAuth } from '~/server/auth/session.server'
import { db } from '~/server/db'
import { permissionModel } from '~/server/db/schemas/auth'
import { parseCSVContent } from '../sat-processor/lib/file-parser'

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

  const fileName = file.name.toLowerCase()

  // Validate file type
  const isValideType = !fileName.endsWith('.csv')

  if (isValideType) {
    return {
      success: false,
      message: 'Unsupported file',
    }
  }
  const content = await file.text()
  const rows = parseCSVContent(content, [
    'resource',
    'action',
    'description',
    'isSystem',
  ])

  rows.forEach(async (row) => {
    const [existing] = await db
      .select()
      .from(permissionModel)
      .where(
        and(
          eq(permissionModel.resource, row.resource),
          eq(permissionModel.action, row.action)
        )
      )
      .limit(1)

    if (!existing) {
      await db.insert(permissionModel).values({
        resource: row.resource,
        action: row.action,
        description: row.description,
        isSystem: row.isSystem === 'TRUE',
      })
    }
  })

  return {
    success: true,
    message: 'Permissions are created',
  }
}
