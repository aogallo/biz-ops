import { and, eq } from 'drizzle-orm'
import { db } from '~/server/db'
import {
  invitationRoleModel,
  memberModel,
  memberRoleModel,
  organizationModel,
  permissionModel,
  roleModel,
  rolePermissionModel,
  userModel,
} from '../db/schemas/auth'

/**
 * Create system role for the organization admin
 * Should be called when creating a super admin user in the organization admin
 * Creates super-admin without permissions, because we only validate the role
 * @param organizationId - Organization ID
 * @returns
 */
export async function createSystemRolesForAdminOrg(organizationId: string) {
  const superId = crypto.randomUUID()
  await db.insert(roleModel).values({
    id: superId,
    organizationId,
    name: 'super-admin',
    description: 'Full administarion for system',
    isSystem: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  })

  return { superId }
}

/**
 * Create system permissions for a new organization
 * Creates update, delete, and view permissions for an organization
 * @returns Array Object with permissions
 */
export async function createSystemOrganizationPermissions() {
  const existingPermissions = await db
    .select()
    .from(permissionModel)
    .where(eq(permissionModel.resource, 'organization'))

  if (existingPermissions.length > 0) {
    return existingPermissions
  }

  console.log('Seeding organization permissions...')
  const permissions = [
    {
      resource: 'organization',
      action: 'update',
      description: 'Update Organization',
      isSystem: true,
    },
    {
      resource: 'organization',
      action: 'delete',
      description: 'Delete Organization',
      isSystem: true,
    },
    {
      resource: 'organization',
      action: 'view',
      description: 'View Organization',
      isSystem: true,
    },
  ]
  return await db.insert(permissionModel).values(permissions).returning()
}
/**
 * Create system roles for a new organization
 * Should be called when an organization is created
 * Creates owner, admin, and member roles with appropriate permissions
 * @param organizationId - Organization ID
 * @returns Object with role IDs
 */
export async function createSystemRoles(organizationId: string) {
  console.log(`Creating system roles for organization ${organizationId}`)
  // Get all permissions
  const existingPermissions = await createSystemOrganizationPermissions()

  console.log('Existing permissions:', existingPermissions)

  // Owner role - all permissions
  const ownerId = crypto.randomUUID()
  await db.insert(roleModel).values({
    id: ownerId,
    organizationId,
    name: 'owner',
    description: 'Full organization access with all permissions',
    isSystem: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  })

  // Assign all permissions to owner
  await db.insert(rolePermissionModel).values(
    existingPermissions.map((p) => ({
      id: crypto.randomUUID(),
      roleId: ownerId,
      permissionId: p.id,
      organizationId,
      createdAt: new Date(),
      updatedAt: new Date(),
    }))
  )

  // Admin role - most permissions except settings:manage
  const adminId = crypto.randomUUID()
  const adminPermissions = existingPermissions.filter(
    (p) => !(p.resource === 'organization' && p.action === 'delete')
  )

  await db.insert(roleModel).values({
    id: adminId,
    organizationId,
    name: 'admin',
    description: 'Administrative access with most permissions',
    isSystem: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  })

  await db.insert(rolePermissionModel).values(
    adminPermissions.map((p) => ({
      id: crypto.randomUUID(),
      roleId: adminId,
      permissionId: p.id,
      organizationId,
      createdAt: new Date(),
      updatedAt: new Date(),
    }))
  )

  // Member role - read-only permissions
  const memberId = crypto.randomUUID()
  const memberPermissions = existingPermissions.filter(
    (p) => p.action === 'read' || p.action === 'view'
  )

  await db.insert(roleModel).values({
    id: memberId,
    organizationId,
    name: 'member',
    description: 'Basic member with read-only access',
    isSystem: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  })

  await db.insert(rolePermissionModel).values(
    memberPermissions.map((p) => ({
      id: crypto.randomUUID(),
      roleId: memberId,
      permissionId: p.id,
      organizationId,
      createdAt: new Date(),
      updatedAt: new Date(),
    }))
  )

  console.log(
    `✅ Created system roles for organization ${organizationId}: owner, admin, member`
  )

  return { ownerId, adminId, memberId }
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
  permissionIds: string[]
) {
  const roleId = crypto.randomUUID()

  // Create role
  const [newRole] = await db
    .insert(roleModel)
    .values({
      id: roleId,
      organizationId,
      name,
      description,
      isSystem: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning()

  // Assign permissions
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
    )
  }

  return newRole
}

/**
 * Get all roles for an organization
 * @param organizationId - Organization ID
 * @returns Array of roles
 */
export async function getRolesByOrganization(organizationId: string) {
  return await db
    .select()
    .from(roleModel)
    .where(eq(roleModel.organizationId, organizationId))
}

/**
 * Get permissions for a specific role
 * @param roleId - Role ID
 * @returns Array of permissions
 */
export async function getRolePermissions(roleId: string) {
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
    .where(eq(rolePermissionModel.roleId, roleId))

  return results
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
    .from(roleModel)
    .where(
      and(
        eq(roleModel.organizationId, organizationId),
        eq(roleModel.name, roleName)
      )
    )
    .limit(1)

  return result || null
}

/**
 * Update role permissions
 * @param roleId - Role ID
 * @param permissionIds - New array of permission IDs
 */
export async function updateRolePermissions(
  roleId: string,
  organizationId: string,
  permissionIds: string[]
) {
  // Delete existing permissions
  await db
    .delete(rolePermissionModel)
    .where(eq(rolePermissionModel.roleId, roleId))

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
    )
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
    .from(roleModel)
    .where(eq(roleModel.id, roleId))
    .limit(1)

  if (!roleToDelete) {
    return false
  }

  if (roleToDelete.isSystem) {
    throw new Error('Cannot delete system roles')
  }

  // Delete role (cascade will handle rolePermission)
  await db.delete(roleModel).where(eq(roleModel.id, roleId))

  return true
}

/**
 * Delete system roles and permissions for an organization
 * Should be called when an organization is deleted
 * Delete owner, admin, and member roles with appropriate permissions
 * @param organizationId - Organization ID
 * @returns boolean success
 */
export async function deleteSystemRoles(organizationId: string) {
  try {
    console.log(`Deleting system roles for organization ${organizationId}`)
    const existingRoles = await db
      .select()
      .from(roleModel)
      .where(eq(roleModel.organizationId, organizationId))

    existingRoles.forEach(async (role) => {
      await db.delete(roleModel).where(eq(roleModel.id, role.id))
    })
  } catch (error) {
    console.error('Failed to delete system roles', error)
  }
}

/**
 * Assign specific role for a member (legacy - updates member.roleId for backward compatibility)
 * @deprecated Use assignRoleToMember for junction table approach
 * @param roleId - Role ID
 * @param memberId - Member ID
 * @returns boolean success
 */
export async function assignRole(roleId: string, memberId: string) {
  try {
    console.log(`Assigning role ${roleId} to member ${memberId}`)
    // Update legacy roleId for backward compatibility
    await db
      .update(memberModel)
      .set({ roleId: roleId })
      .where(eq(memberModel.id, memberId))

    // Also insert into junction table
    await db
      .insert(memberRoleModel)
      .values({
        memberId,
        roleId,
      })
      .onConflictDoNothing()

    console.log(`✅ Assigned role ${roleId} to member ${memberId}`)
    return true
  } catch (error) {
    console.error(
      `Failed to assign role ${roleId} to member ${memberId}`,
      error
    )
    return false
  }
}

/**
 * Add a role to a member (many-to-many via junction table)
 * @param memberId - Member ID
 * @param roleId - Role ID
 * @returns Created member_role record
 */
export async function assignRoleToMember(memberId: string, roleId: string) {
  const [result] = await db
    .insert(memberRoleModel)
    .values({ memberId, roleId })
    .onConflictDoNothing()
    .returning()

  return result
}

/**
 * Add multiple roles to a member (many-to-many via junction table)
 * @param memberId - Member ID
 * @param roleIds - Array of Role IDs
 * @returns Created member_role records
 */
export async function assignRolesToMember(memberId: string, roleIds: string[]) {
  if (roleIds.length === 0) return []

  const results = await db
    .insert(memberRoleModel)
    .values(roleIds.map((roleId) => ({ memberId, roleId })))
    .onConflictDoNothing()
    .returning()

  return results
}

/**
 * Remove a role from a member
 * @param memberId - Member ID
 * @param roleId - Role ID
 * @returns boolean success
 */
export async function removeRoleFromMember(
  memberId: string,
  roleId: string
): Promise<boolean> {
  await db
    .delete(memberRoleModel)
    .where(
      and(
        eq(memberRoleModel.memberId, memberId),
        eq(memberRoleModel.roleId, roleId)
      )
    )

  return true
}

/**
 * Get all roles for a member
 * @param memberId - Member ID
 * @returns Array of roles
 */
export async function getMemberRoles(memberId: string) {
  const results = await db
    .select({
      id: roleModel.id,
      name: roleModel.name,
      description: roleModel.description,
      isSystem: roleModel.isSystem,
      organizationId: roleModel.organizationId,
    })
    .from(memberRoleModel)
    .innerJoin(roleModel, eq(memberRoleModel.roleId, roleModel.id))
    .where(eq(memberRoleModel.memberId, memberId))

  return results
}

/**
 * Replace all roles for a member (removes existing, adds new)
 * @param memberId - Member ID
 * @param roleIds - Array of Role IDs to set
 * @returns Updated member_role records
 */
export async function setMemberRoles(memberId: string, roleIds: string[]) {
  // Delete all existing roles for this member
  await db.delete(memberRoleModel).where(eq(memberRoleModel.memberId, memberId))

  // Insert new roles
  if (roleIds.length === 0) return []

  const results = await db
    .insert(memberRoleModel)
    .values(roleIds.map((roleId) => ({ memberId, roleId })))
    .returning()

  return results
}

/**
 * Add a role to an invitation (many-to-many via junction table)
 * @param invitationId - Invitation ID
 * @param roleId - Role ID
 * @returns Created invitation_role record
 */
export async function assignRoleToInvitation(
  invitationId: string,
  roleId: string
) {
  const [result] = await db
    .insert(invitationRoleModel)
    .values({ invitationId, roleId })
    .onConflictDoNothing()
    .returning()

  return result
}

/**
 * Add multiple roles to an invitation (many-to-many via junction table)
 * @param invitationId - Invitation ID
 * @param roleIds - Array of Role IDs
 * @returns Created invitation_role records
 */
export async function assignRolesToInvitation(
  invitationId: string,
  roleIds: string[]
) {
  if (roleIds.length === 0) return []

  const results = await db
    .insert(invitationRoleModel)
    .values(roleIds.map((roleId) => ({ invitationId, roleId })))
    .onConflictDoNothing()
    .returning()

  return results
}

/**
 * Get all roles for an invitation
 * @param invitationId - Invitation ID
 * @returns Array of roles
 */
export async function getInvitationRoles(invitationId: string) {
  const results = await db
    .select({
      id: roleModel.id,
      name: roleModel.name,
      description: roleModel.description,
      isSystem: roleModel.isSystem,
      organizationId: roleModel.organizationId,
    })
    .from(invitationRoleModel)
    .innerJoin(roleModel, eq(invitationRoleModel.roleId, roleModel.id))
    .where(eq(invitationRoleModel.invitationId, invitationId))

  return results
}

/**
 * Replace all roles for an invitation (removes existing, adds new)
 * @param invitationId - Invitation ID
 * @param roleIds - Array of Role IDs to set
 * @returns Updated invitation_role records
 */
export async function setInvitationRoles(
  invitationId: string,
  roleIds: string[]
) {
  // Delete all existing roles for this invitation
  await db
    .delete(invitationRoleModel)
    .where(eq(invitationRoleModel.invitationId, invitationId))

  // Insert new roles
  if (roleIds.length === 0) return []

  const results = await db
    .insert(invitationRoleModel)
    .values(roleIds.map((roleId) => ({ invitationId, roleId })))
    .returning()

  return results
}

interface HasRolesParams {
  userId: string
  organizationId: string
  roleName: string
}

/**
 * Check if user has specific role in organization
 * @param Object
 * @param userId - User ID
 * @param organizationId - Organization ID
 * @param roleName - Role (e.g., "super-admin")
 * @returns boolean
 */
export async function hasRole({
  userId,
  organizationId,
  roleName,
}: HasRolesParams) {
  try {
    const [existingUser] = await db
      .select()
      .from(userModel)
      .where(eq(userModel.id, userId))
      .limit(1)

    if (!existingUser) {
      return false
    }

    const [existingOrganization] = await db
      .select()
      .from(organizationModel)
      .where(eq(organizationModel.id, organizationId))
      .limit(1)

    if (!existingOrganization) {
      return false
    }

    const data = await db
      .select()
      .from(memberRoleModel)
      .innerJoin(memberModel, eq(memberModel.id, memberRoleModel.memberId))
      .innerJoin(roleModel, eq(roleModel.id, memberRoleModel.roleId))
      .where(and(eq(memberModel.userId, userId), eq(roleModel.name, roleName)))

    return data.length > 0
  } catch (e) {
    const error = e instanceof Error ? e.message : 'No error information'
    console.error(`Failed to validate Role: ${roleName} error: ${error}`)
    return false
  }
}
