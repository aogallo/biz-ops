import { and, eq } from 'drizzle-orm'
import { redirect } from 'react-router'
import { db } from '~/server/db'
import {
  memberModel,
  permissionModel,
  roleModel,
  rolePermissionModel,
} from '../db/schemas/auth'

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
  const [resource, action] = permissionString.split(':')

  console.log('data...', resource, action)
  if (!resource || !action) {
    console.warn(`Invalid permission format: ${permissionString}`)
    return false
  }

  // Query: member → role → rolePermission → permission
  const result = await db
    .select()
    .from(memberModel)
    .innerJoin(roleModel, eq(memberModel.roleId, roleModel.id))
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
  const results = await db
    .select({
      resource: permissionModel.resource,
      action: permissionModel.action,
    })
    .from(memberModel)
    .innerJoin(roleModel, eq(memberModel.roleId, roleModel.id))
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
 * Throws redirect if user lacks permission
 * @param userId - User ID
 * @param organizationId - Organization ID
 * @param permissionString - Required permission in "resource:action" format
 * @throws Redirect with 403 status if permission denied
 */
export async function requirePermission(
  userId: string,
  organizationId: string,
  permissionString: string
): Promise<void> {
  const allowed = await hasPermission(userId, organizationId, permissionString)

  console.log('allowed........', allowed)

  if (!allowed) {
    throw redirect('/organization', {
      status: 403,
      headers: {
        'X-Message': "You don't have permission for this action",
      },
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
