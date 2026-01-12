import type { LoaderFunctionArgs } from "react-router";
import { json } from "~/lib/response";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "~/server/auth/session.server";
import { isSuperAdmin } from "~/server/permissions";
import { db } from "~/server/db";
import { user, member, organization, role } from "~/server/db/schema";

/**
 * GET /api/users/list?organizationId=xxx
 * Lists users with role-based filtering:
 * - Super admins can see all users across all organizations
 * - Organization admins can only see users in their organization
 */
export async function loader({ request }: LoaderFunctionArgs) {
  // Require authentication
  const session = await requireAuth(request);

  // Parse query parameters
  const url = new URL(request.url);
  const organizationId = url.searchParams.get("organizationId");

  try {
    // Check if user is super admin
    const { db: dbInstance } = await import("~/server/db");
    const isSuperAdminUser = await isSuperAdmin(dbInstance, session.user.id);

    let users;

    if (isSuperAdminUser) {
      // Super admin can see all users
      if (organizationId) {
        // Filter by specific organization
        users = await db
          .select({
            id: user.id,
            name: user.name,
            email: user.email,
            emailVerified: user.emailVerified,
            image: user.image,
            createdAt: user.createdAt,
            organizationId: organization.id,
            organizationName: organization.name,
            memberRole: member.role,
            roleId: member.roleId,
            roleName: role.name,
          })
          .from(user)
          .innerJoin(member, eq(member.userId, user.id))
          .innerJoin(organization, eq(organization.id, member.organizationId))
          .leftJoin(role, eq(role.id, member.roleId))
          .where(eq(organization.id, organizationId))
          .orderBy(user.createdAt);
      } else {
        // Get all users across all organizations
        users = await db
          .select({
            id: user.id,
            name: user.name,
            email: user.email,
            emailVerified: user.emailVerified,
            image: user.image,
            createdAt: user.createdAt,
            organizationId: organization.id,
            organizationName: organization.name,
            memberRole: member.role,
            roleId: member.roleId,
            roleName: role.name,
          })
          .from(user)
          .innerJoin(member, eq(member.userId, user.id))
          .innerJoin(organization, eq(organization.id, member.organizationId))
          .leftJoin(role, eq(role.id, member.roleId))
          .orderBy(user.createdAt);
      }
    } else {
      // Regular users can only see users in their own organization
      if (!organizationId) {
        return json(
          { error: "organizationId is required for non-admin users" },
          { status: 400 }
        );
      }

      // Check if user is member of the requested organization
      const { member: memberTable } = await import("~/server/db/schema");
      const [membership] = await db
        .select()
        .from(memberTable)
        .where(and(
          eq(memberTable.userId, session.user.id),
          eq(memberTable.organizationId, organizationId)
        ))
        .limit(1);

      if (!membership) {
        return json(
          { error: "You don't have access to this organization" },
          { status: 403 }
        );
      }

      // Get users in the organization
      users = await db
        .select({
          id: user.id,
          name: user.name,
          email: user.email,
          emailVerified: user.emailVerified,
          image: user.image,
          createdAt: user.createdAt,
          organizationId: organization.id,
          organizationName: organization.name,
          memberRole: member.role,
          roleId: member.roleId,
          roleName: role.name,
        })
        .from(user)
        .innerJoin(member, eq(member.userId, user.id))
        .innerJoin(organization, eq(organization.id, member.organizationId))
        .leftJoin(role, eq(role.id, member.roleId))
        .where(eq(organization.id, organizationId))
        .orderBy(user.createdAt);
    }

    return json({
      success: true,
      users,
      isSuperAdmin: isSuperAdminUser,
    });
  } catch (error: any) {
    console.error("Error listing users:", error);
    return json(
      { error: "Failed to list users" },
      { status: 500 }
    );
  }
}
