import { hashPassword } from "better-auth/crypto";
import { eq } from "drizzle-orm";
import type { ActionFunctionArgs } from "react-router";
import { json } from "~/lib/response";
import auth from "~/server/auth-server";
import { getRoleByName } from "~/server/auth/roles.server";
import { requireAuth } from "~/server/auth/session.server";
import { db } from "~/server/db";
import {
  account,
  invitation,
  member,
  organization,
  role,
  user,
} from "~/server/db/schema";
import { isOrgAdmin, isSuperAdmin } from "~/server/permissions";

interface CreateUserBody {
  name: string;
  email: string;
  organizationId: string;
  roleId?: string; // Optional custom role ID
  sendInvitation?: boolean; // Whether to send invitation email (default: true)
}

/**
 * POST /api/users/create
 * Creates a new user and optionally sends an invitation email
 * - Super admins can create users for any organization
 * - Organization admins can create users for their own organization
 */
export async function action({ request }: ActionFunctionArgs) {
  // Require authentication
  const session = await requireAuth(request);

  // Parse request body
  const body = (await request.json()) as CreateUserBody;
  console.log("request....", body);

  // Validate required fields
  if (!body.name || !body.email || !body.organizationId) {
    return json(
      { error: "Name, email, and organizationId are required" },
      { status: 400 },
    );
  }

  try {
    // Check permissions
    const { db: dbInstance } = await import("~/server/db");
    const isSuperAdminUser = await isSuperAdmin(dbInstance, session.user.id);
    const isOrgAdminUser = await isOrgAdmin(
      dbInstance,
      session.user.id,
      body.organizationId,
    );

    if (!isSuperAdminUser && !isOrgAdminUser) {
      return json(
        {
          error:
            "You don't have permission to create users for this organization",
        },
        { status: 403 },
      );
    }

    // Check if user already exists
    const [existingUser] = await db
      .select()
      .from(user)
      .where(eq(user.email, body.email))
      .limit(1);

    if (existingUser) {
      return json(
        { error: "A user with this email already exists" },
        { status: 409 },
      );
    }

    // Get target organization
    const [targetOrg] = await db
      .select()
      .from(organization)
      .where(eq(organization.id, body.organizationId))
      .limit(1);

    if (!targetOrg) {
      return json({ error: "Organization not found" }, { status: 404 });
    }

    // Create user
    const userId = crypto.randomUUID();
    const temporaryPassword = crypto.randomUUID(); // Generate temporary password
    const hashedPassword = await hashPassword(temporaryPassword);

    const [newUser] = await db
      .insert(user)
      .values({
        id: userId,
        name: body.name,
        email: body.email,
        emailVerified: false, // Will be verified when they accept invitation
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    // Create account with temporary password
    await db.insert(account).values({
      id: crypto.randomUUID(),
      accountId: userId,
      providerId: "credential",
      userId: userId,
      password: hashedPassword,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Determine role for the user
    let roleId = body.roleId;
    if (!roleId) {
      // Default to member role
      const memberRole = await getRoleByName(body.organizationId, "member");
      roleId = memberRole?.id;
    }

    // Create membership
    await db.insert(member).values({
      id: crypto.randomUUID(),
      organizationId: body.organizationId,
      userId: userId,
      role: "member", // For Better Auth compatibility
      roleId: roleId || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Send invitation email via Better Auth if requested (default: true)
    let invitationId: string | undefined;
    const shouldSendInvitation = body.sendInvitation !== false;

    if (shouldSendInvitation) {
      try {
        // Get role name for the invitation
        let roleName = "member";
        if (roleId) {
          const [roleRecord] = await db
            .select()
            .from(role)
            .where(eq(role.id, roleId))
            .limit(1);
          if (roleRecord) {
            roleName = roleRecord.name;
          }
        }

        // Create invitation via Better Auth (automatically sends email)
        const invitationResponse = await auth.api.createInvitation({
          headers: request.headers,
          body: {
            organizationId: body.organizationId,
            email: body.email,
            role: roleName as "member" | "admin" | "owner",
          },
        });

        const invitationData = invitationResponse as any as { id: string };
        invitationId = invitationData.id;

        // Update invitation with roleId
        if (roleId && invitationId) {
          await db
            .update(invitation)
            .set({
              roleId,
              inviterId: session.user.id,
            })
            .where(eq(invitation.id, invitationId));
        }
      } catch (emailError) {
        console.error("Failed to send invitation email:", emailError);
        // Don't fail the user creation if email fails
      }
    }

    return json({
      success: true,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
      },
      invitation: invitationId
        ? {
            id: invitationId,
            status: "pending",
          }
        : null,
      message: shouldSendInvitation
        ? "User created and invitation email sent"
        : "User created successfully",
    });
  } catch (error: any) {
    console.error("Error creating user:", error);
    return json({ error: "Failed to create user" }, { status: 500 });
  }
}
