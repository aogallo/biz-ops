import { hashPassword } from "better-auth/crypto";
import { eq } from "drizzle-orm";
import type { ActionFunctionArgs } from "react-router";
import { json } from "~/lib/response";
import auth from "~/server/auth-server";
import { getRoleByName } from "~/server/auth/roles.server";
import { requireAuth } from "~/server/auth/session.server";
import { db } from "~/server/db";
import {
  accountModel,
  invitationModel,
  memberModel,
  organizationModel,
  roleModel,
  userModel,
} from "~/server/db/schemas/auth";
import { isOrgAdmin, isSuperAdmin } from "~/server/permissions";

interface BulkUserData {
  name: string;
  email: string;
  roleId?: string;
}

interface BulkCreateUsersBody {
  organizationId: string;
  users: BulkUserData[];
  sendInvitations?: boolean; // Whether to send invitation emails (default: true)
}

interface BulkCreateResult {
  success: boolean;
  created: number;
  failed: number;
  errors: Array<{ email: string; error: string }>;
  users: Array<{
    id: string;
    name: string;
    email: string;
  }>;
}

/**
 * POST /api/users/bulk-create
 * Creates multiple users at once and optionally sends invitation emails
 * - Super admins can create users for any organization
 * - Organization admins can create users for their own organization
 */
export async function action({ request }: ActionFunctionArgs) {
  // Require authentication
  const session = await requireAuth(request);

  // Parse request body
  const body = (await request.json()) as BulkCreateUsersBody;

  // Validate required fields
  if (!body.organizationId || !body.users || !Array.isArray(body.users)) {
    return json(
      { error: "organizationId and users array are required" },
      { status: 400 },
    );
  }

  if (body.users.length === 0) {
    return json({ error: "Users array cannot be empty" }, { status: 400 });
  }

  if (body.users.length > 100) {
    return json(
      { error: "Cannot create more than 100 users at once" },
      { status: 400 },
    );
  }

  try {
    // Check permissions
    const { db: dbInstance } = await import("~/server/db");
    const isSuperAdminUser = await isSuperAdmin(session.user.id);
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

    // Get target organization
    const [targetOrg] = await db
      .select()
      .from(organizationModel)
      .where(eq(organizationModel.id, body.organizationId))
      .limit(1);

    if (!targetOrg) {
      return json({ error: "Organization not found" }, { status: 404 });
    }

    const result: BulkCreateResult = {
      success: true,
      created: 0,
      failed: 0,
      errors: [],
      users: [],
    };

    const shouldSendInvitations = body.sendInvitations !== false;

    // Process each user
    for (const userData of body.users) {
      try {
        // Validate user data
        if (!userData.name || !userData.email) {
          result.failed++;
          result.errors.push({
            email: userData.email || "unknown",
            error: "Name and email are required",
          });
          continue;
        }

        // Check if user already exists
        const [existingUser] = await db
          .select()
          .from(userModel)
          .where(eq(userModel.email, userData.email))
          .limit(1);

        if (existingUser) {
          result.failed++;
          result.errors.push({
            email: userData.email,
            error: "User with this email already exists",
          });
          continue;
        }

        // Create user
        const userId = crypto.randomUUID();
        const temporaryPassword = crypto.randomUUID();
        const hashedPassword = await hashPassword(temporaryPassword);

        const [newUser] = await db
          .insert(userModel)
          .values({
            id: userId,
            name: userData.name,
            email: userData.email,
            emailVerified: false,
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          .returning();

        // Create account
        await db.insert(accountModel).values({
          id: crypto.randomUUID(),
          accountId: userId,
          providerId: "credential",
          userId: userId,
          password: hashedPassword,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        // Determine role
        let roleId = userData.roleId;
        if (!roleId) {
          const memberRole = await getRoleByName(body.organizationId, "member");
          roleId = memberRole?.id;
        }

        // Create membership
        await db.insert(memberModel).values({
          id: crypto.randomUUID(),
          organizationId: body.organizationId,
          userId: userId,
          role: "member",
          roleId: roleId || null,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        // Send invitation via Better Auth if requested
        if (shouldSendInvitations) {
          try {
            // Get role name for the invitation
            let roleName = "member";
            if (roleId) {
              const [roleRecord] = await db
                .select()
                .from(roleModel)
                .where(eq(roleModel.id, roleId))
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
                email: userData.email,
                role: roleName as "member" | "admin" | "owner",
              },
            });

            const invitationData = invitationResponse as any as { id: string };

            // Update invitation with roleId
            if (roleId && invitationData.id) {
              await db
                .update(invitationModel)
                .set({
                  roleId,
                  inviterId: session.user.id,
                })
                .where(eq(invitationModel.id, invitationData.id));
            }
          } catch (emailError) {
            console.error(
              `Failed to send invitation to ${userData.email}:`,
              emailError,
            );
            // Don't fail the creation if email fails
          }
        }

        result.created++;
        result.users.push({
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
        });
      } catch (error: any) {
        console.error(`Error creating user ${userData.email}:`, error);
        result.failed++;
        result.errors.push({
          email: userData.email,
          error: error.message || "Failed to create user",
        });
      }
    }

    return json({
      ...result,
      message: `Successfully created ${result.created} user(s). ${result.failed} failed.`,
    });
  } catch (error: any) {
    console.error("Error in bulk user creation:", error);
    return json(
      { error: "Failed to process bulk user creation" },
      { status: 500 },
    );
  }
}
