import { and, eq, sql } from 'drizzle-orm'
import { db } from '~/server/db'
import { permissionModel, rolePermissionModel } from '~/server/db/schemas/auth'
import type { CreatePermissionInput, UpdatePermissionInput } from '../schemas'

/**
 * Permissions Repository - Full CRUD operations for permissions
 * Permissions are global (not organization-scoped)
 */
export class PermissionsRepository {
  /**
   * Create a new permission
   */
  async create(data: CreatePermissionInput) {
    const [permission] = await db
      .insert(permissionModel)
      .values({
        id: crypto.randomUUID(),
        resource: data.resource,
        action: data.action,
        description: data.description,
        isSystem: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning()

    return permission
  }

  /**
   * Get permission by ID
   */
  async getById(id: string) {
    const [permission] = await db
      .select()
      .from(permissionModel)
      .where(eq(permissionModel.id, id))
      .limit(1)

    return permission || null
  }

  /**
   * Get all permissions ordered by resource, action
   */
  async getAll() {
    return await db
      .select()
      .from(permissionModel)
      .orderBy(permissionModel.resource, permissionModel.action)
  }

  /**
   * Update permission by ID
   */
  async update(id: string, data: UpdatePermissionInput) {
    const updateData: Record<string, string | Date | null | undefined> = {
      updatedAt: new Date(),
    }

    if (data.resource !== undefined) updateData.resource = data.resource
    if (data.action !== undefined) updateData.action = data.action
    if (data.description !== undefined) updateData.description = data.description

    const [permission] = await db
      .update(permissionModel)
      .set(updateData)
      .where(eq(permissionModel.id, id))
      .returning()

    return permission || null
  }

  /**
   * Delete permission by ID
   */
  async delete(id: string) {
    await db.delete(permissionModel).where(eq(permissionModel.id, id))
    return true
  }

  /**
   * Check if a permission with the same resource and action exists
   * Optionally exclude a specific ID (for updates)
   */
  async existsByResourceAction(
    resource: string,
    action: string,
    excludeId?: string
  ) {
    const conditions = excludeId
      ? and(
          eq(permissionModel.resource, resource),
          eq(permissionModel.action, action),
          sql`${permissionModel.id} != ${excludeId}`
        )
      : and(
          eq(permissionModel.resource, resource),
          eq(permissionModel.action, action)
        )

    const [permission] = await db
      .select({ id: permissionModel.id })
      .from(permissionModel)
      .where(conditions)
      .limit(1)

    return !!permission
  }

  /**
   * Check if permission is a system permission
   */
  async isSystemPermission(permissionId: string) {
    const [permission] = await db
      .select({ isSystem: permissionModel.isSystem })
      .from(permissionModel)
      .where(eq(permissionModel.id, permissionId))
      .limit(1)

    return permission?.isSystem || false
  }

  /**
   * Get count of roles using this permission
   */
  async getRoleCount(permissionId: string) {
    const [result] = await db
      .select({ count: sql<number>`count(distinct ${rolePermissionModel.roleId})` })
      .from(rolePermissionModel)
      .where(eq(rolePermissionModel.permissionId, permissionId))

    return Number(result.count)
  }

  /**
   * Check if permission can be deleted
   */
  async canDelete(permissionId: string) {
    // Check if it's a system permission
    const isSystem = await this.isSystemPermission(permissionId)
    if (isSystem) {
      return {
        canDelete: false,
        reason: 'System permissions cannot be deleted',
      }
    }

    // Check if roles are using this permission
    const roleCount = await this.getRoleCount(permissionId)
    if (roleCount > 0) {
      return {
        canDelete: false,
        reason: `Cannot delete permission. ${roleCount} role(s) are still using this permission.`,
      }
    }

    return { canDelete: true }
  }
}

export const permissionsRepository = new PermissionsRepository()
