import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { organization } from "better-auth/plugins";
import { db } from "../server/db";
import { getInitialOrganization } from "./auth/organization-queries.server";
import {
  assignRoleToMember,
  createSystemRoles,
  deleteSystemRoles,
  getInvitationRoles,
} from "./auth/roles.server";
import { schema } from "./db/schemas";
import { sendInvitationEmail } from "./email/invitation.server";

// Generate RFC 4122-compliant UUIDs for Better Auth records
// This ensures compatibility with PostgreSQL's UUID type
function generateId(): string {
  return crypto.randomUUID();
}

const auth = betterAuth({
  basePath: "/api/auth",
  emailAndPassword: { enabled: true },
  database: drizzleAdapter(db, {
    provider: "pg", // Use 'pg' for both node-postgres and neon-http (both PostgreSQL-compatible)
    schema,
  }),
  advanced: {
    database: {
      generateId, // Use crypto.randomUUID() for all Better Auth records
    },
  },
  databaseHooks: {
    session: {
      create: {
        before: async (session) => {
          const { organization } = await getInitialOrganization(session.userId);
          return {
            data: {
              ...session,
              activeOrganizationId: organization?.id,
            },
          };
        },
      },
    },
  },
  plugins: [
    organization({
      async sendInvitationEmail(data) {
        try {
          // Query custom role table to get user-facing role name
          let roleName = data.role; // Default to Better Auth role

          // Look up invitation roles from junction table
          const invitationRoles = await getInvitationRoles(data.id);

          if (invitationRoles.length > 0) {
            // Use first role name for email
            roleName = invitationRoles[0].name;
          }

          // Call existing email service with mapped parameters
          await sendInvitationEmail({
            to: data.email,
            inviterName: data.inviter.user.name || "A team member",
            organizationName: data.organization.name,
            invitationToken: data.id,
            roleName,
          });
        } catch (error) {
          console.error("Failed to send invitation email:", error);
          // Don't throw - email failures shouldn't block invitation creation
        }
      },
      organizationHooks: {
        afterCreateOrganization: async ({ organization, member }) => {
          // Run custom logic after organization is created
          // e.g., create default resources, send notifications

          const { ownerId } = await createSystemRoles(organization.id);
          await assignRoleToMember(member.id, ownerId);
        },
        beforeDeleteOrganization: async ({ organization }) => {
          // a callback to run after deleting org

          console.log("Deleting organization roles...", organization);
          // Clean up related resources, notify users, etc.
          await deleteSystemRoles(organization.id);
        },
      },
    }),
  ],
});

export default auth;
