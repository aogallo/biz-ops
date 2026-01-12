import type { LoaderFunctionArgs } from "react-router";
import { json } from "~/lib/response";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "~/server/auth/session.server";
import { isSuperAdmin } from "~/server/permissions";
import { db } from "~/server/db";
import { invitation, organization, user } from "~/server/db/schema";

/**
 * GET /api/invitations/list?organizationId=xxx
 * Lists invitations with role-based filtering:
 * - Super admins can see all invitations across all organizations
 * - Organization admins/members can only see invitations in their organization
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

    let invitations;

    if (isSuperAdminUser) {
      // Super admin can see all invitations
      if (organizationId) {
        // Filter by specific organization
        invitations = await db
          .select({
            id: invitation.id,
            email: invitation.email,
            role: invitation.role,
            status: invitation.status,
            expiresAt: invitation.expiresAt,
            createdAt: invitation.createdAt,
            organizationId: organization.id,
            organizationName: organization.name,
            inviterName: user.name,
            inviterEmail: user.email,
          })
          .from(invitation)
          .innerJoin(organization, eq(organization.id, invitation.organizationId))
          .innerJoin(user, eq(user.id, invitation.inviterId))
          .where(eq(organization.id, organizationId))
          .orderBy(invitation.createdAt);
      } else {
        // Get all invitations across all organizations
        invitations = await db
          .select({
            id: invitation.id,
            email: invitation.email,
            role: invitation.role,
            status: invitation.status,
            expiresAt: invitation.expiresAt,
            createdAt: invitation.createdAt,
            organizationId: organization.id,
            organizationName: organization.name,
            inviterName: user.name,
            inviterEmail: user.email,
          })
          .from(invitation)
          .innerJoin(organization, eq(organization.id, invitation.organizationId))
          .innerJoin(user, eq(user.id, invitation.inviterId))
          .orderBy(invitation.createdAt);
      }
    } else {
      // Regular users can only see invitations in their own organization
      if (!organizationId) {
        return json(
          { error: "organizationId is required for non-admin users" },
          { status: 400 }
        );
      }

      // Check if user is member of the requested organization
      const { member } = await import("~/server/db/schema");
      const [membership] = await db
        .select()
        .from(member)
        .where(and(
          eq(member.userId, session.user.id),
          eq(member.organizationId, organizationId)
        ))
        .limit(1);

      if (!membership) {
        return json(
          { error: "You don't have access to this organization" },
          { status: 403 }
        );
      }

      // Get invitations in the organization
      invitations = await db
        .select({
          id: invitation.id,
          email: invitation.email,
          role: invitation.role,
          status: invitation.status,
          expiresAt: invitation.expiresAt,
          createdAt: invitation.createdAt,
          organizationId: organization.id,
          organizationName: organization.name,
          inviterName: user.name,
          inviterEmail: user.email,
        })
        .from(invitation)
        .innerJoin(organization, eq(organization.id, invitation.organizationId))
        .innerJoin(user, eq(user.id, invitation.inviterId))
        .where(eq(organization.id, organizationId))
        .orderBy(invitation.createdAt);
    }

    return json({
      success: true,
      invitations,
      isSuperAdmin: isSuperAdminUser,
    });
  } catch (error: any) {
    console.error("Error listing invitations:", error);
    return json(
      { error: "Failed to list invitations" },
      { status: 500 }
    );
  }
}
