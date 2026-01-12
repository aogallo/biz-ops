import { and, eq } from "drizzle-orm";
import { redirect } from "react-router";
import auth from "~/server/auth-server";
import { db } from "~/server/db";
import { member, organization, role } from "~/server/db/schema";
import type { SessionData } from "./session.server";

export interface OrganizationMember {
  id: string;
  organizationId: string;
  userId: string;
  role: string; // 'owner' | 'admin' | 'member' - from legacyRole during migration
  roleId: string | null; // Future: RBAC role ID
  createdAt: Date;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  createdAt: Date;
}

/**
 * Require user to be a member of organization admin
 * Returns organization and memberships data
 */
export async function requireOrganizationAdmin(session: SessionData) {
  const [membership] = await db
    .select()
    .from(member)
    .innerJoin(role, eq(member.roleId, role.id))
    .where(
      and(eq(member.userId, session.user.id), eq(role.name, "super-admin")),
    )
    .limit(1);

  if (!membership) {
    throw redirect("/organization", {
      headers: {
        "X-Message": "You don't have access to this operation",
      },
    });
  }

  // Get organization
  const [org] = await db
    .select()
    .from(organization)
    .where(eq(organization.id, membership.member.organizationId))
    .limit(1);

  if (!org) {
    throw redirect("/organization");
  }

  return {
    organization: org,
    membership: {
      ...membership,
    },
  };
}

/**
 * Require user to be member of active organization
 * Returns organization and membership data
 */
export async function requireOrganization(
  session: SessionData,
): Promise<{ organization: Organization; membership: OrganizationMember }> {
  if (!session.session.activeOrganizationId) {
    throw redirect("/organization", {
      headers: {
        "X-Message": "Please select an organization",
      },
    });
  }

  // Get membership
  const [membership] = await db
    .select()
    .from(member)
    .where(
      and(
        eq(member.userId, session.user.id),
        eq(member.organizationId, session.session.activeOrganizationId),
      ),
    )
    .limit(1);

  if (!membership) {
    throw redirect("/organization", {
      headers: {
        "X-Message": "You don't have access to this organization",
      },
    });
  }

  // Get organization
  const [org] = await db
    .select()
    .from(organization)
    .where(eq(organization.id, session.session.activeOrganizationId))
    .limit(1);

  if (!org) {
    throw redirect("/organization");
  }

  return {
    organization: org,
    membership: {
      ...membership,
      role: membership.legacyRole || "member", // Fallback to legacyRole during migration
    } as OrganizationMember,
  };
}

/**
 * Require specific role in organization
 */
export async function requireRole(
  session: SessionData,
  allowedRoles: string[],
): Promise<{ organization: Organization; membership: OrganizationMember }> {
  const data = await requireOrganization(session);

  if (!allowedRoles.includes(data.membership.role)) {
    throw redirect("/organization", {
      headers: {
        "X-Message": "You don't have permission for this action",
      },
    });
  }

  return data;
}

/**
 * Get all organizations user is member of
 * If user is super admin, returns ALL organizations
 */
export async function getUserOrganizations(userId: string) {
  // Check if user is super admin (member of admin org with super_admin role)
  const superAdminCheck = await db
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
        eq(role.name, "super-admin"),
      ),
    )
    .limit(1);

  const isSuperAdmin = superAdminCheck.length > 0;

  if (isSuperAdmin) {
    // Super admin: return ALL organizations
    const allOrgs = await db.select().from(organization);

    // Return in same format but without membership data for non-member orgs
    return allOrgs.map((org) => ({
      membership: {
        id: "",
        organizationId: org.id,
        userId: userId,
        role: "super-admin",
        roleId: null,
        createdAt: org.createdAt,
      },
      organization: {
        id: org.id,
        name: org.name,
        slug: org.slug,
        logo: org.logo,
        createdAt: org.createdAt,
      },
    }));
  }

  // Regular user: return only organizations they're members of
  const memberships = await db
    .select()
    .from(member)
    .innerJoin(organization, eq(organization.id, member.organizationId))
    .where(eq(member.userId, userId));

  // Transform the result to match expected structure
  return memberships.map((row) => ({
    membership: {
      id: row.member.id,
      organizationId: row.member.organizationId,
      userId: row.member.userId,
      role: row.member.role,
      roleId: row.member.roleId,
      createdAt: row.member.createdAt,
    },
    organization: {
      id: row.organization.id,
      name: row.organization.name,
      slug: row.organization.slug,
      logo: row.organization.logo,
      createdAt: row.organization.createdAt,
    },
  }));
}

/**
 * Set active organization for a user session
 * If organizationId is not provided, sets the first organization the user is a member of
 */
export async function setActiveOrganization(
  request: Request,
  organizationId?: string,
): Promise<void> {
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  if (!session?.user) {
    throw new Error("User not authenticated");
  }

  let targetOrgId = organizationId;

  // If no organization ID provided, get the first one
  if (!targetOrgId) {
    const memberships = await db
      .select({ organizationId: member.organizationId })
      .from(member)
      .where(eq(member.userId, session.user.id))
      .limit(1);

    if (memberships.length === 0) {
      throw new Error("User is not a member of any organization");
    }

    targetOrgId = memberships[0].organizationId;
  }

  // Set active organization using Better Auth
  await auth.api.setActiveOrganization({
    headers: request.headers,
    body: {
      organizationId: targetOrgId,
    },
  });
}

/**
 * Get the active organization ID from the session
 */
export async function getActiveOrganization(
  request: Request,
): Promise<string | null> {
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  return session?.session?.activeOrganizationId ?? null;
}

/**
 * Get the first organization user is member of
 */
export async function getInitialOrganization(userId: string) {
  // Regular user: return only organizations they're members of
  const memberships = await db
    .select()
    .from(member)
    .innerJoin(organization, eq(organization.id, member.organizationId))
    .where(eq(member.userId, userId))
    .limit(1);

  // Transform the result to match expected structure
  return {
    organization: memberships[0].organization,
  };
}
