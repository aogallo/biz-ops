import { hashPassword } from "better-auth/crypto";
import "dotenv/config";
import { eq } from "drizzle-orm";
import { createSystemRolesForAdminOrg } from "../app/server/auth/roles.server";

import { db } from "../app/server/db";
import {
  accountModel,
  memberModel,
  organizationModel,
  userModel,
} from "../app/server/db/schemas/auth";

// Environment validation
const SUPER_ADMIN_EMAIL = process.env.SUPER_ADMIN_EMAIL;
const SUPER_ADMIN_PASSWORD = process.env.SUPER_ADMIN_PASSWORD;
const SUPER_ADMIN_NAME = process.env.SUPER_ADMIN_NAME || "Super Administrator";

async function main() {
  console.log("🚀 Starting super admin seed...\n");

  // Validate environment variables
  if (!SUPER_ADMIN_EMAIL || !SUPER_ADMIN_PASSWORD) {
    throw new Error(
      "❌ SUPER_ADMIN_EMAIL and SUPER_ADMIN_PASSWORD environment variables are required",
    );
  }

  try {
    // Check if user already exists
    const [existingUser] = await db
      .select()
      .from(userModel)
      .where(eq(userModel.email, SUPER_ADMIN_EMAIL))
      .limit(1);

    let userId: string;
    let userDB: typeof userModel.$inferSelect;

    if (existingUser) {
      console.log(`⏭️  Super admin user already exists: ${SUPER_ADMIN_EMAIL}`);
      userId = existingUser.id;
      userDB = existingUser;

      // Check if user has an organization
      const existingMember = await db
        .select()
        .from(memberModel)
        .where(eq(memberModel.userId, userId))
        .limit(1);

      if (existingMember.length > 0) {
        console.log("✅ User already has an organization");
        console.log("✨ Seed completed (no changes made)\n");
        return;
      }

      console.log("📝 User exists but has no organization, creating one...\n");
    } else {
      // Create new user
      userId = crypto.randomUUID();
      [userDB] = await db
        .insert(userModel)
        .values({
          id: userId,
          name: SUPER_ADMIN_NAME,
          email: SUPER_ADMIN_EMAIL,
          emailVerified: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      console.log(`✅ Created user: ${userDB.email}`);

      // Create account with hashed password
      const hashedPassword = await hashPassword(SUPER_ADMIN_PASSWORD);
      await db.insert(accountModel).values({
        id: crypto.randomUUID(),
        accountId: userId,
        providerId: "credential",
        userId: userId,
        password: hashedPassword,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      console.log(`✅ Created account with credentials`);
    }

    // Create super admin organization
    const orgId = crypto.randomUUID();
    const [org] = await db
      .insert(organizationModel)
      .values({
        id: orgId,
        name: "Super Admin Organization",
        slug: "super-admin",
        isAdmin: true, // Mark as admin organization
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    console.log(`✅ Created admin organization: ${org.name}`);

    // 4. Create system roles
    const { superId } = await createSystemRolesForAdminOrg(orgId);
    console.log(`✅ Created system roles (super-admin)`);

    // 5. Assign user as owner
    await db.insert(memberModel).values({
      id: crypto.randomUUID(),
      organizationId: orgId,
      userId: userId,
      role: "owner", // For Better Auth compatibility
      roleId: superId, // For RBAC system
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    console.log(`✅ Assigned ${userDB.email} as owner and super-admin`);

    console.log("\n✨ Super admin created successfully!");
    console.log("\nCredentials:");
    console.log(`  Email: ${SUPER_ADMIN_EMAIL}`);
    console.log(`  Password: ${SUPER_ADMIN_PASSWORD.replace(/./g, "*")}`);
    console.log("\n🔐 You can now log in with these credentials.\n");
  } catch (error) {
    console.error("\n❌ Error creating super admin:", error);
    throw error;
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
