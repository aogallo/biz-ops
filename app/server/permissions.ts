import { and, eq } from 'drizzle-orm'
import { db } from './db'
import { memberModel, memberRoleModel, organizationModel, roleModel } from './db/schemas/auth'

export const SUPER_ADMIN_ROLE = 'super-admin'
export const ADMIN_ROLE = 'admin'
export const MEMBER_ROLE = 'member'

/**
 * Check if a user is a super admin (member of an admin organization with super-admin role)
 */
export async function isSuperAdmin(userId: string): Promise<boolean> {
  const result = await db
    .select({
      isSuperAdmin: organizationModel.isAdmin,
    })
    .from(memberModel)
    .innerJoin(
      organizationModel,
      eq(memberModel.organizationId, organizationModel.id)
    )
    .innerJoin(memberRoleModel, eq(memberRoleModel.memberId, memberModel.id))
    .innerJoin(roleModel, eq(memberRoleModel.roleId, roleModel.id))
    .where(
      and(
        eq(memberModel.userId, userId),
        eq(organizationModel.isAdmin, true),
        eq(roleModel.name, SUPER_ADMIN_ROLE)
      )
    )
    .limit(1)

  return result.length > 0
}

/**
 * Check if a user is a member of an admin organization
 */
export async function isAdminOrgMember(userId: string): Promise<boolean> {
  const result = await db
    .select({
      isAdmin: organizationModel.isAdmin,
    })
    .from(memberModel)
    .innerJoin(
      organizationModel,
      eq(memberModel.organizationId, organizationModel.id)
    )
    .where(
      and(eq(memberModel.userId, userId), eq(organizationModel.isAdmin, true))
    )
    .limit(1)

  return result.length > 0
}

/**
 * Check if a user has admin role in a specific organization
 */
export async function isOrgAdmin(
  userId: string,
  organizationId: string
): Promise<boolean> {
  const result = await db
    .select({
      role: memberModel.role,
    })
    .from(memberModel)
    .where(
      and(
        eq(memberModel.userId, userId),
        eq(memberModel.organizationId, organizationId)
      )
    )
    .limit(1)

  if (result.length === 0) return false

  // Check both legacy role and Better Auth compatibility role
  return result[0].role === 'admin' || result[0].role === 'owner'
}

/**
 * Get all organizations where the user is a member
 */
export async function getUserOrganizations(userId: string) {
  return await db
    .select({
      id: organizationModel.id,
      name: organizationModel.name,
      slug: organizationModel.slug,
      logo: organizationModel.logo,
      isAdmin: organizationModel.isAdmin,
      role: memberModel.role,
      createdAt: organizationModel.createdAt,
    })
    .from(memberModel)
    .innerJoin(
      organizationModel,
      eq(memberModel.organizationId, organizationModel.id)
    )
    .where(eq(memberModel.userId, userId))
}

/**
 * Check if user has permission to perform action on resource
 * Super admins bypass all permission checks
 */
export async function hasPermission(
  userId: string
  // resource: string,
  // action: string
): Promise<boolean> {
  // Super admins have all permissions
  if (await isSuperAdmin(userId)) {
    return true
  }

  // TODO: Implement granular permission checking via rolePermission table
  // For now, return false (will be implemented in next phase)
  return false
}
