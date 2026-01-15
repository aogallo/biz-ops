import { and, eq } from "drizzle-orm";
import { db } from "~/server/db";
import {
  invitationModel,
  memberModel,
  organizationModel,
  roleModel,
  userModel,
} from "~/server/db/schemas/auth";

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
      .orderBy(userModel.createdAt);
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
          eq(invitationModel.status, "pending"),
        ),
      )
      .orderBy(invitationModel.createdAt);
  }

  /**
   * Check if user exists by email (across all orgs)
   */
  async getByEmail(email: string) {
    const [user] = await db
      .select()
      .from(userModel)
      .where(eq(userModel.email, email))
      .limit(1);
    return user || null;
  }

  /**
   * Get user by ID
   */
  async getById(userId: string) {
    const [user] = await db
      .select()
      .from(userModel)
      .where(eq(userModel.id, userId))
      .limit(1);
    return user || null;
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
          eq(memberModel.organizationId, organizationId),
        ),
      )
      .limit(1);
    return member || null;
  }

  /**
   * Remove user from organization (delete member record)
   * Note: This does NOT delete the user account (Better Auth manages that)
   */
  async removeMember(memberId: string) {
    await db.delete(memberModel).where(eq(memberModel.id, memberId));
    return true;
  }

  /**
   * Cancel pending invitation
   */
  async cancelInvitation(invitationId: string) {
    await db
      .update(invitationModel)
      .set({ status: "cancelled", updatedAt: new Date() })
      .where(eq(invitationModel.id, invitationId));
    return true;
  }

  /**
   * Update member role in an organization
   */
  async updateMemberRole(memberId: string, roleId: string) {
    await db
      .update(memberModel)
      .set({ roleId, updatedAt: new Date() })
      .where(eq(memberModel.id, memberId));
    return true;
  }
}

export const usersRepository = new UsersRepository();
