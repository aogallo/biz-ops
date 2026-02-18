import { and, eq } from 'drizzle-orm'
import { db } from '~/server/db'
import {
  memberModel,
  memberRoleModel,
  permissionModel,
  roleModel,
  rolePermissionModel,
} from '../db/schemas/auth'
import { isSuperAdmin } from '~/server/permissions'

/**
 * Check if user has specific permission in organization
 * @param userId - User ID
 * @param organizationId - Organization ID
 * @param permissionString - Permission in "resource:action" format (e.g., "product:create")
 * @returns boolean
 */
export async function hasPermission(
  userId: string,
  organizationId: string,
  permissionString: string
): Promise<boolean> {
  // Super admins bypass all permission checks
  if (await isSuperAdmin(userId)) {
    return true
  }

  const [resource, action] = permissionString.split(':')

  if (!resource || !action) {
    console.warn(`Invalid permission format: ${permissionString}`)
    return false
  }

  // Query: member → memberRole → role → rolePermission → permission
  // Aggregates permissions from ALL roles assigned to the member
  const result = await db
    .select()
    .from(memberModel)
    .innerJoin(memberRoleModel, eq(memberModel.id, memberRoleModel.memberId))
    .innerJoin(roleModel, eq(memberRoleModel.roleId, roleModel.id))
    .innerJoin(
      rolePermissionModel,
      eq(roleModel.id, rolePermissionModel.roleId)
    )
    .innerJoin(
      permissionModel,
      eq(rolePermissionModel.permissionId, permissionModel.id)
    )
    .where(
      and(
        eq(memberModel.userId, userId),
        eq(memberModel.organizationId, organizationId),
        eq(permissionModel.resource, resource),
        eq(permissionModel.action, action)
      )
    )
    .limit(1)

  return result.length > 0
}

/**
 * Get all permissions for user in organization
 * @param userId - User ID
 * @param organizationId - Organization ID
 * @returns Array of permission strings in "resource:action" format
 */
export async function getUserPermissions(
  userId: string,
  organizationId: string
): Promise<string[]> {
  // Query: member → memberRole → role → rolePermission → permission
  // Aggregates permissions from ALL roles assigned to the member
  const results = await db
    .selectDistinct({
      resource: permissionModel.resource,
      action: permissionModel.action,
    })
    .from(memberModel)
    .innerJoin(memberRoleModel, eq(memberModel.id, memberRoleModel.memberId))
    .innerJoin(roleModel, eq(memberRoleModel.roleId, roleModel.id))
    .innerJoin(
      rolePermissionModel,
      eq(roleModel.id, rolePermissionModel.roleId)
    )
    .innerJoin(
      permissionModel,
      eq(rolePermissionModel.permissionId, permissionModel.id)
    )
    .where(
      and(
        eq(memberModel.userId, userId),
        eq(memberModel.organizationId, organizationId)
      )
    )

  return results.map((r) => `${r.resource}:${r.action}`)
}

/**
 * Require permission middleware for route handlers
 * Throws 403 Response if user lacks permission
 * @param userId - User ID
 * @param organizationId - Organization ID
 * @param permissionString - Required permission in "resource:action" format
 * @throws Response with 403 status if permission denied (handled by ErrorBoundary)
 */
export async function requirePermission(
  userId: string,
  organizationId: string,
  permissionString: string
): Promise<void> {
  const allowed = await hasPermission(userId, organizationId, permissionString)

  if (!allowed) {
    throw new Response(`Permission denied: ${permissionString}`, {
      status: 403,
      statusText: "You don't have permission for this action",
    })
  }
}

/**
 * Check multiple permissions (OR logic)
 * Returns true if user has ANY of the specified permissions
 * @param userId - User ID
 * @param organizationId - Organization ID
 * @param permissions - Array of permission strings
 * @returns boolean
 */
export async function hasAnyPermission(
  userId: string,
  organizationId: string,
  permissions: string[]
): Promise<boolean> {
  const results = await Promise.all(
    permissions.map((p) => hasPermission(userId, organizationId, p))
  )
  return results.some((r) => r === true)
}

/**
 * Check multiple permissions (AND logic)
 * Returns true only if user has ALL specified permissions
 * @param userId - User ID
 * @param organizationId - Organization ID
 * @param permissions - Array of permission strings
 * @returns boolean
 */
export async function hasAllPermissions(
  userId: string,
  organizationId: string,
  permissions: string[]
): Promise<boolean> {
  const results = await Promise.all(
    permissions.map((p) => hasPermission(userId, organizationId, p))
  )
  return results.every((r) => r === true)
}

/**
 * Get permissions grouped by resource
 * Useful for UI display of user capabilities
 * @param userId - User ID
 * @param organizationId - Organization ID
 * @returns Object with resources as keys and actions as arrays
 */
export async function getUserPermissionsGrouped(
  userId: string,
  organizationId: string
): Promise<Record<string, string[]>> {
  const perms = await getUserPermissions(userId, organizationId)
  const grouped: Record<string, string[]> = {}

  for (const perm of perms) {
    const [resource, action] = perm.split(':')
    if (!grouped[resource]) {
      grouped[resource] = []
    }
    grouped[resource].push(action)
  }

  return grouped
}
