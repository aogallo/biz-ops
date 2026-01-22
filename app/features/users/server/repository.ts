import { and, eq, inArray } from 'drizzle-orm'
import { db } from '~/server/db'
import {
  invitationModel,
  invitationRoleModel,
  memberModel,
  memberRoleModel,
  roleModel,
  userModel,
} from '~/server/db/schemas/auth'

/**
 * Users Repository - Query-only operations
 * Does NOT create users (Better Auth owns that)
 * Only queries users, memberships, and invitations
 */
export class UsersRepository {
  /**
   * Get all users in an organization with their roles
   */
  async getAllByOrganization(organizationId: string) {
    return await db
      .select({
        id: userModel.id,
        name: userModel.name,
        email: userModel.email,
        emailVerified: userModel.emailVerified,
        image: userModel.image,
        createdAt: userModel.createdAt,
        memberId: memberModel.id,
        memberRole: memberModel.role, // Better Auth role (owner/admin/member)
        roleId: memberModel.roleId,
        roleName: roleModel.name,
        roleDescription: roleModel.description,
      })
      .from(userModel)
      .innerJoin(memberModel, eq(memberModel.userId, userModel.id))
      .leftJoin(roleModel, eq(roleModel.id, memberModel.roleId))
      .where(eq(memberModel.organizationId, organizationId))
      .orderBy(userModel.createdAt)
  }

  /**
   * Get pending invitations for an organization
   */
  async getPendingInvitations(organizationId: string) {
    return await db
      .select({
        id: invitationModel.id,
        email: invitationModel.email,
        role: invitationModel.role,
        status: invitationModel.status,
        expiresAt: invitationModel.expiresAt,
        createdAt: invitationModel.createdAt,
        roleId: invitationModel.roleId,
        roleName: roleModel.name,
        inviterName: userModel.name,
      })
      .from(invitationModel)
      .leftJoin(roleModel, eq(roleModel.id, invitationModel.roleId))
      .leftJoin(userModel, eq(userModel.id, invitationModel.inviterId))
      .where(
        and(
          eq(invitationModel.organizationId, organizationId),
          eq(invitationModel.status, 'pending')
        )
      )
      .orderBy(invitationModel.createdAt)
  }

  /**
   * Check if user exists by email (across all orgs)
   */
  async getByEmail(email: string) {
    const [user] = await db
      .select()
      .from(userModel)
      .where(eq(userModel.email, email))
      .limit(1)
    return user || null
  }

  /**
   * Get user by ID
   */
  async getById(userId: string) {
    const [user] = await db
      .select()
      .from(userModel)
      .where(eq(userModel.id, userId))
      .limit(1)
    return user || null
  }

  /**
   * Get member record for a user in an organization
   */
  async getMemberByUserId(userId: string, organizationId: string) {
    const [member] = await db
      .select()
      .from(memberModel)
      .where(
        and(
          eq(memberModel.userId, userId),
          eq(memberModel.organizationId, organizationId)
        )
      )
      .limit(1)
    return member || null
  }

  /**
   * Remove user from organization (delete member record)
   * Note: This does NOT delete the user account (Better Auth manages that)
   */
  async removeMember(memberId: string) {
    await db.delete(memberModel).where(eq(memberModel.id, memberId))
    return true
  }

  /**
   * Cancel pending invitation
   */
  async cancelInvitation(invitationId: string) {
    await db
      .update(invitationModel)
      .set({ status: 'cancelled', updatedAt: new Date() })
      .where(eq(invitationModel.id, invitationId))
    return true
  }

  /**
   * Update member role in an organization (legacy - updates single roleId)
   * @deprecated Use updateMemberRoles for junction table approach
   */
  async updateMemberRole(memberId: string, roleId: string) {
    // Update legacy roleId for backward compatibility
    await db
      .update(memberModel)
      .set({ roleId, updatedAt: new Date() })
      .where(eq(memberModel.id, memberId))

    // Also update junction table - replace all with the single role
    await db
      .delete(memberRoleModel)
      .where(eq(memberRoleModel.memberId, memberId))

    await db.insert(memberRoleModel).values({ memberId, roleId })

    return true
  }

  /**
   * Get all roles for a member (many-to-many via junction table)
   */
  async getMemberRoles(memberId: string) {
    return await db
      .select({
        id: roleModel.id,
        name: roleModel.name,
        description: roleModel.description,
        isSystem: roleModel.isSystem,
      })
      .from(memberRoleModel)
      .innerJoin(roleModel, eq(memberRoleModel.roleId, roleModel.id))
      .where(eq(memberRoleModel.memberId, memberId))
  }

  /**
   * Set member roles (replaces all existing roles)
   */
  async setMemberRoles(memberId: string, roleIds: string[]) {
    // Delete all existing roles
    await db
      .delete(memberRoleModel)
      .where(eq(memberRoleModel.memberId, memberId))

    // Insert new roles
    if (roleIds.length > 0) {
      await db.insert(memberRoleModel).values(
        roleIds.map((roleId) => ({ memberId, roleId }))
      )

      // Update legacy roleId for backward compatibility (use first role)
      await db
        .update(memberModel)
        .set({ roleId: roleIds[0], updatedAt: new Date() })
        .where(eq(memberModel.id, memberId))
    }

    return true
  }

  /**
   * Add a role to a member
   */
  async addRoleToMember(memberId: string, roleId: string) {
    await db
      .insert(memberRoleModel)
      .values({ memberId, roleId })
      .onConflictDoNothing()

    return true
  }

  /**
   * Remove a role from a member
   */
  async removeRoleFromMember(memberId: string, roleId: string) {
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
   * Get all users in an organization with their roles (many-to-many)
   * Returns users with arrays of roles
   */
  async getAllByOrganizationWithRoles(organizationId: string) {
    // First get all users in the organization
    const users = await db
      .select({
        id: userModel.id,
        name: userModel.name,
        email: userModel.email,
        emailVerified: userModel.emailVerified,
        image: userModel.image,
        createdAt: userModel.createdAt,
        memberId: memberModel.id,
        memberRole: memberModel.role,
      })
      .from(userModel)
      .innerJoin(memberModel, eq(memberModel.userId, userModel.id))
      .where(eq(memberModel.organizationId, organizationId))
      .orderBy(userModel.createdAt)

    // Get all member IDs
    const memberIds = users.map((u) => u.memberId)
    if (memberIds.length === 0) return []

    // Get all roles for these members from junction table
    const memberRoles = await db
      .select({
        memberId: memberRoleModel.memberId,
        roleId: roleModel.id,
        roleName: roleModel.name,
        roleDescription: roleModel.description,
        isSystem: roleModel.isSystem,
      })
      .from(memberRoleModel)
      .innerJoin(roleModel, eq(memberRoleModel.roleId, roleModel.id))
      .where(inArray(memberRoleModel.memberId, memberIds))

    // Group roles by member ID
    const rolesByMember = memberRoles.reduce(
      (acc, mr) => {
        if (!acc[mr.memberId]) {
          acc[mr.memberId] = []
        }
        acc[mr.memberId].push({
          id: mr.roleId,
          name: mr.roleName,
          description: mr.roleDescription,
          isSystem: mr.isSystem,
        })
        return acc
      },
      {} as Record<string, Array<{ id: string; name: string; description: string | null; isSystem: boolean }>>
    )

    // Merge users with their roles
    return users.map((user) => ({
      ...user,
      roles: rolesByMember[user.memberId] || [],
    }))
  }

  /**
   * Get invitation roles from junction table
   */
  async getInvitationRoles(invitationId: string) {
    return await db
      .select({
        id: roleModel.id,
        name: roleModel.name,
        description: roleModel.description,
        isSystem: roleModel.isSystem,
      })
      .from(invitationRoleModel)
      .innerJoin(roleModel, eq(invitationRoleModel.roleId, roleModel.id))
      .where(eq(invitationRoleModel.invitationId, invitationId))
  }
}

export const usersRepository = new UsersRepository()
