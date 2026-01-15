import { and, eq, sql } from "drizzle-orm";
import { db } from "~/server/db";
import {
  memberModel,
  permissionModel,
  roleModel,
  rolePermissionModel,
} from "~/server/db/schemas/auth";
import type { CreateRoleInput } from "../schemas";

/**
 * Roles Repository - Full CRUD operations for custom roles
 * Includes permission management
 */
export class RolesRepository {
  /**
   * Create a new custom role with permissions
   */
  async create(data: CreateRoleInput) {
    const roleId = crypto.randomUUID();

    // Create role
    const [newRole] = await db
      .insert(roleModel)
      .values({
        id: roleId,
        organizationId: data.organizationId,
        name: data.name,
        description: data.description,
        isSystem: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    // Assign permissions
    if (data.permissionIds.length > 0) {
      await db.insert(rolePermissionModel).values(
        data.permissionIds.map((permId) => ({
          id: crypto.randomUUID(),
          roleId,
          permissionId: permId,
          organizationId: data.organizationId,
          createdAt: new Date(),
          updatedAt: new Date(),
        }))
      );
    }

    return newRole;
  }

  /**
   * Get role by ID
   */
  async getById(id: string) {
    const [role] = await db
      .select()
      .from(roleModel)
      .where(eq(roleModel.id, id))
      .limit(1);
    return role || null;
  }

  /**
   * Get all roles for an organization
   */
  async getAllByOrganization(organizationId: string) {
    return await db
      .select()
      .from(roleModel)
      .where(eq(roleModel.organizationId, organizationId))
      .orderBy(roleModel.name);
  }

  /**
   * Get role by name within an organization
   */
  async getByName(organizationId: string, roleName: string) {
    const [result] = await db
      .select()
      .from(roleModel)
      .where(
        and(
          eq(roleModel.organizationId, organizationId),
          eq(roleModel.name, roleName)
        )
      )
      .limit(1);
    return result || null;
  }

  /**
   * Get permissions for a specific role
   */
  async getRolePermissions(roleId: string) {
    const results = await db
      .select({
        id: permissionModel.id,
        resource: permissionModel.resource,
        action: permissionModel.action,
        description: permissionModel.description,
      })
      .from(rolePermissionModel)
      .innerJoin(
        permissionModel,
        eq(rolePermissionModel.permissionId, permissionModel.id)
      )
      .where(eq(rolePermissionModel.roleId, roleId));

    return results;
  }

  /**
   * Get all available permissions
   */
  async getAllPermissions() {
    return await db
      .select()
      .from(permissionModel)
      .orderBy(permissionModel.resource, permissionModel.action);
  }

  /**
   * Update role
   */
  async update(id: string, data: Partial<CreateRoleInput>) {
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (data.name) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;

    const [role] = await db
      .update(roleModel)
      .set(updateData)
      .where(eq(roleModel.id, id))
      .returning();

    return role || null;
  }

  /**
   * Assign permissions to role (replaces existing)
   */
  async assignPermissions(
    roleId: string,
    permissionIds: string[],
    organizationId: string
  ) {
    // Delete existing permissions for this role
    await db
      .delete(rolePermissionModel)
      .where(eq(rolePermissionModel.roleId, roleId));

    // Insert new permissions
    if (permissionIds.length > 0) {
      await db.insert(rolePermissionModel).values(
        permissionIds.map((permId) => ({
          id: crypto.randomUUID(),
          roleId,
          permissionId: permId,
          organizationId,
          createdAt: new Date(),
          updatedAt: new Date(),
        }))
      );
    }
  }

  /**
   * Delete role (cascade will handle rolePermission)
   */
  async delete(id: string) {
    await db.delete(roleModel).where(eq(roleModel.id, id));
    return true;
  }

  /**
   * Check if role name exists (for uniqueness validation)
   */
  async existsByName(
    organizationId: string,
    name: string,
    excludeId?: string
  ) {
    const conditions = excludeId
      ? and(
          eq(roleModel.organizationId, organizationId),
          eq(roleModel.name, name),
          sql`${roleModel.id} != ${excludeId}`
        )
      : and(
          eq(roleModel.organizationId, organizationId),
          eq(roleModel.name, name)
        );

    const [role] = await db
      .select({ id: roleModel.id })
      .from(roleModel)
      .where(conditions)
      .limit(1);

    return !!role;
  }

  /**
   * Check if role is a system role
   */
  async isSystemRole(roleId: string) {
    const [role] = await db
      .select({ isSystem: roleModel.isSystem })
      .from(roleModel)
      .where(eq(roleModel.id, roleId))
      .limit(1);

    return role?.isSystem || false;
  }

  /**
   * Check if role can be deleted
   */
  async canDeleteRole(roleId: string) {
    // Check if it's a system role
    const isSystem = await this.isSystemRole(roleId);
    if (isSystem) {
      return {
        canDelete: false,
        reason: "System roles cannot be deleted",
      };
    }

    // Check if members are assigned
    const [result] = await db
      .select({ count: sql<number>`count(*)` })
      .from(memberModel)
      .where(eq(memberModel.roleId, roleId));

    const memberCount = Number(result.count);
    if (memberCount > 0) {
      return {
        canDelete: false,
        reason: `Cannot delete role. ${memberCount} member(s) are still assigned to this role.`,
      };
    }

    return { canDelete: true };
  }
}

export const rolesRepository = new RolesRepository();
