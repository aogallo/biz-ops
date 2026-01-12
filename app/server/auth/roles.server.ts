import { and, eq } from "drizzle-orm";
import { db } from "~/server/db";
import { permission, role, rolePermission } from "~/server/db/schema";

/**
 * Create system role for the organization admin
 * Should be called when creating a super admin user in the organization admin
 * Creates super-admin without permissions, because we only validate the role
 * @param organizationId - Organization ID
 * @returns
 */
export async function createSystemRolesForAdminOrg(organizationId: string) {
  const superId = crypto.randomUUID();
  await db.insert(role).values({
    id: superId,
    organizationId,
    name: "super-admin",
    description: "Full administarion for system",
    isSystem: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  return { superId };
}
/**
 * Create system roles for a new organization
 * Should be called when an organization is created
 * Creates owner, admin, and member roles with appropriate permissions
 * @param organizationId - Organization ID
 * @returns Object with role IDs
 */
export async function createSystemRoles(organizationId: string) {
  // Get all permissions
  const permissions = await db.select().from(permission);

  // Owner role - all permissions
  const ownerId = crypto.randomUUID();
  await db.insert(role).values({
    id: ownerId,
    organizationId,
    name: "owner",
    description: "Full organization access with all permissions",
    isSystem: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  // Assign all permissions to owner
  await db.insert(rolePermission).values(
    permissions.map((p) => ({
      id: crypto.randomUUID(),
      roleId: ownerId,
      permissionId: p.id,
      organizationId,
      createdAt: new Date(),
      updatedAt: new Date(),
    })),
  );

  // Admin role - most permissions except settings:manage
  const adminId = crypto.randomUUID();
  const adminPermissions = permissions.filter(
    (p) => !(p.resource === "settings" && p.action === "manage"),
  );

  await db.insert(role).values({
    id: adminId,
    organizationId,
    name: "admin",
    description: "Administrative access with most permissions",
    isSystem: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  await db.insert(rolePermission).values(
    adminPermissions.map((p) => ({
      id: crypto.randomUUID(),
      roleId: adminId,
      permissionId: p.id,
      organizationId,
      createdAt: new Date(),
      updatedAt: new Date(),
    })),
  );

  // Member role - read-only permissions
  const memberId = crypto.randomUUID();
  const memberPermissions = permissions.filter(
    (p) => p.action === "read" || p.action === "view",
  );

  await db.insert(role).values({
    id: memberId,
    organizationId,
    name: "member",
    description: "Basic member with read-only access",
    isSystem: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  await db.insert(rolePermission).values(
    memberPermissions.map((p) => ({
      id: crypto.randomUUID(),
      roleId: memberId,
      permissionId: p.id,
      organizationId,
      createdAt: new Date(),
      updatedAt: new Date(),
    })),
  );

  console.log(
    `✅ Created system roles for organization ${organizationId}: owner, admin, member`,
  );

  return { ownerId, adminId, memberId };
}

/**
 * Create a custom role with specific permissions
 * @param organizationId - Organization ID
 * @param name - Role name
 * @param description - Role description
 * @param permissionIds - Array of permission IDs to assign
 * @returns Created role
 */
export async function createCustomRole(
  organizationId: string,
  name: string,
  description: string,
  permissionIds: string[],
) {
  const roleId = crypto.randomUUID();

  // Create role
  const [newRole] = await db
    .insert(role)
    .values({
      id: roleId,
      organizationId,
      name,
      description,
      isSystem: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();

  // Assign permissions
  if (permissionIds.length > 0) {
    await db.insert(rolePermission).values(
      permissionIds.map((permId) => ({
        id: crypto.randomUUID(),
        roleId,
        permissionId: permId,
        organizationId,
        createdAt: new Date(),
        updatedAt: new Date(),
      })),
    );
  }

  return newRole;
}

/**
 * Get all roles for an organization
 * @param organizationId - Organization ID
 * @returns Array of roles
 */
export async function getRolesByOrganization(organizationId: string) {
  return await db
    .select()
    .from(role)
    .where(eq(role.organizationId, organizationId));
}

/**
 * Get permissions for a specific role
 * @param roleId - Role ID
 * @returns Array of permissions
 */
export async function getRolePermissions(roleId: string) {
  const results = await db
    .select({
      id: permission.id,
      resource: permission.resource,
      action: permission.action,
      description: permission.description,
    })
    .from(rolePermission)
    .innerJoin(permission, eq(rolePermission.permissionId, permission.id))
    .where(eq(rolePermission.roleId, roleId));

  return results;
}

/**
 * Get a role by name within an organization
 * Useful for finding system roles like "owner", "admin", "member"
 * @param organizationId - Organization ID
 * @param roleName - Role name
 * @returns Role or null
 */
export async function getRoleByName(organizationId: string, roleName: string) {
  const [result] = await db
    .select()
    .from(role)
    .where(
      and(eq(role.organizationId, organizationId), eq(role.name, roleName)),
    )
    .limit(1);

  return result || null;
}

/**
 * Update role permissions
 * @param roleId - Role ID
 * @param permissionIds - New array of permission IDs
 */
export async function updateRolePermissions(
  roleId: string,
  organizationId: string,
  permissionIds: string[],
) {
  // Delete existing permissions
  await db.delete(rolePermission).where(eq(rolePermission.roleId, roleId));

  // Insert new permissions
  if (permissionIds.length > 0) {
    await db.insert(rolePermission).values(
      permissionIds.map((permId) => ({
        id: crypto.randomUUID(),
        roleId,
        permissionId: permId,
        organizationId,
        createdAt: new Date(),
        updatedAt: new Date(),
      })),
    );
  }
}

/**
 * Delete a custom role (system roles cannot be deleted)
 * @param roleId - Role ID
 * @returns boolean success
 */
export async function deleteRole(roleId: string): Promise<boolean> {
  // Check if it's a system role
  const [roleToDelete] = await db
    .select()
    .from(role)
    .where(eq(role.id, roleId))
    .limit(1);

  if (!roleToDelete) {
    return false;
  }

  if (roleToDelete.isSystem) {
    throw new Error("Cannot delete system roles");
  }

  // Delete role (cascade will handle rolePermission)
  await db.delete(role).where(eq(role.id, roleId));

  return true;
}
