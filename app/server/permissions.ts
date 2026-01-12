import { eq, and } from "drizzle-orm";
import { member, organization, role } from "./db/schema";

export const SUPER_ADMIN_ROLE = "super-admin";
export const ADMIN_ROLE = "admin";
export const MEMBER_ROLE = "member";

/**
 * Check if a user is a super admin (member of an admin organization with super-admin role)
 */
export async function isSuperAdmin(
  db: any,
  userId: string
): Promise<boolean> {
  const result = await db
    .select({
      isSuperAdmin: organization.isAdmin,
    })
    .from(member)
    .innerJoin(organization, eq(member.organizationId, organization.id))
    .leftJoin(role, eq(member.roleId, role.id))
    .where(
      and(
        eq(member.userId, userId),
        eq(organization.isAdmin, true),
        eq(role.name, SUPER_ADMIN_ROLE)
      )
    )
    .limit(1);

  return result.length > 0;
}

/**
 * Check if a user is a member of an admin organization
 */
export async function isAdminOrgMember(
  db: any,
  userId: string
): Promise<boolean> {
  const result = await db
    .select({
      isAdmin: organization.isAdmin,
    })
    .from(member)
    .innerJoin(organization, eq(member.organizationId, organization.id))
    .where(and(eq(member.userId, userId), eq(organization.isAdmin, true)))
    .limit(1);

  return result.length > 0;
}

/**
 * Check if a user has admin role in a specific organization
 */
export async function isOrgAdmin(
  db: any,
  userId: string,
  organizationId: string
): Promise<boolean> {
  const result = await db
    .select({
      role: member.role,
    })
    .from(member)
    .where(
      and(
        eq(member.userId, userId),
        eq(member.organizationId, organizationId)
      )
    )
    .limit(1);

  if (result.length === 0) return false;

  // Check both legacy role and Better Auth compatibility role
  return result[0].role === "admin" || result[0].role === "owner";
}

/**
 * Get all organizations where the user is a member
 */
export async function getUserOrganizations(
  db: any,
  userId: string
) {
  return await db
    .select({
      id: organization.id,
      name: organization.name,
      slug: organization.slug,
      logo: organization.logo,
      isAdmin: organization.isAdmin,
      role: member.role,
      createdAt: organization.createdAt,
    })
    .from(member)
    .innerJoin(organization, eq(member.organizationId, organization.id))
    .where(eq(member.userId, userId));
}

/**
 * Check if user has permission to perform action on resource
 * Super admins bypass all permission checks
 */
export async function hasPermission(
  db: any,
  userId: string,
  resource: string,
  action: string
): Promise<boolean> {
  // Super admins have all permissions
  if (await isSuperAdmin(db, userId)) {
    return true;
  }

  // TODO: Implement granular permission checking via rolePermission table
  // For now, return false (will be implemented in next phase)
  return false;
}
