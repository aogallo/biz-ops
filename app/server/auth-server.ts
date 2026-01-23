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

const isDev = process.env.NODE_ENV === "development";

// Helper to convert ArrayBuffer or Uint8Array to hex string
function bufferToHex(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// Helper to convert hex string to Uint8Array
function hexToBuffer(hex: string): Uint8Array<ArrayBuffer> {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
  }
  return bytes as Uint8Array<ArrayBuffer>;
}

// Low-cost PBKDF2 for development (Cloudflare Workers free tier)
// WARNING: Only use in development - not secure for production!
const devPasswordConfig = isDev
  ? {
      hash: async (password: string): Promise<string> => {
        const salt = crypto.getRandomValues(new Uint8Array(16));
        const encoder = new TextEncoder();
        const key = await crypto.subtle.importKey(
          "raw",
          encoder.encode(password),
          "PBKDF2",
          false,
          ["deriveBits"]
        );
        // Low iterations for dev (1000 vs 600000 recommended for production)
        const bits = await crypto.subtle.deriveBits(
          { name: "PBKDF2", salt, iterations: 1000, hash: "SHA-256" },
          key,
          256
        );
        const saltHex = bufferToHex(salt);
        const hashHex = bufferToHex(bits);
        return `pbkdf2:${saltHex}:${hashHex}`;
      },
      verify: async ({
        hash,
        password,
      }: {
        hash: string;
        password: string;
      }): Promise<boolean> => {
        const [prefix, saltHex, storedHash] = hash.split(":");
        if (prefix !== "pbkdf2") {
          // Hash was created with production algorithm, can't verify in dev
          console.warn(
            "Cannot verify production password hash in development mode"
          );
          return false;
        }
        const salt = hexToBuffer(saltHex);
        const encoder = new TextEncoder();
        const key = await crypto.subtle.importKey(
          "raw",
          encoder.encode(password),
          "PBKDF2",
          false,
          ["deriveBits"]
        );
        const bits = await crypto.subtle.deriveBits(
          { name: "PBKDF2", salt, iterations: 1000, hash: "SHA-256" },
          key,
          256
        );
        return bufferToHex(bits) === storedHash;
      },
    }
  : undefined;

if (isDev) {
  console.warn(
    "⚠️  Using low-cost password hashing for development. DO NOT use in production!"
  );
}

const auth = betterAuth({
  basePath: "/api/auth",
  emailAndPassword: {
    enabled: true,
    ...(devPasswordConfig && { password: devPasswordConfig }),
  },
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
