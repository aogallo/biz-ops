import "dotenv/config";
import { db } from "../app/server/db";
import { organization, member, role } from "../app/server/db/schema";
import { eq, and } from "drizzle-orm";

async function testGetOrganizations() {
  console.log("=== Testing getUserOrganizations Function ===\n");

  // First, let's see all organizations in the database
  console.log("1. All organizations in database:");
  const allOrgs = await db.select().from(organization);
  console.log(`   Found ${allOrgs.length} organizations:`);
  allOrgs.forEach((org) => {
    console.log(`   - ${org.name} (${org.slug}) [isAdmin: ${org.isAdmin}]`);
  });

  console.log("\n2. All members:");
  const allMembers = await db
    .select({
      userId: member.userId,
      orgId: member.organizationId,
      role: member.role,
      roleId: member.roleId,
    })
    .from(member);
  console.log(`   Found ${allMembers.length} members:`);
  allMembers.forEach((m) => {
    console.log(
      `   - User: ${m.userId}, Org: ${m.orgId}, Role: ${m.role}, RoleId: ${m.roleId}`,
    );
  });

  console.log("\n3. All roles:");
  const allRoles = await db.select().from(role);
  console.log(`   Found ${allRoles.length} roles:`);
  allRoles.forEach((r) => {
    console.log(
      `   - ${r.name} (Org: ${r.organizationId}) [isSystem: ${r.isSystem}]`,
    );
  });

  console.log("\n4. Checking super admin status for first user:");
  if (allMembers.length > 0) {
    const firstUserId = allMembers[0].userId;
    console.log(`   User ID: ${firstUserId}`);

    // Check if user is super admin
    const superAdminCheck = await db
      .select({
        isSuperAdmin: organization.isAdmin,
        orgName: organization.name,
        roleName: role.name,
      })
      .from(member)
      .innerJoin(organization, eq(member.organizationId, organization.id))
      .leftJoin(role, eq(member.roleId, role.id))
      .where(
        and(eq(member.userId, firstUserId), eq(organization.isAdmin, true)),
      );

    console.log(`   Super admin check results:`, superAdminCheck);

    // Now check with role name condition
    const superAdminCheckWithRole = await db
      .select({
        isSuperAdmin: organization.isAdmin,
        orgName: organization.name,
        roleName: role.name,
      })
      .from(member)
      .innerJoin(organization, eq(member.organizationId, organization.id))
      .leftJoin(role, eq(member.roleId, role.id))
      .where(
        and(
          eq(member.userId, firstUserId),
          eq(organization.isAdmin, true),
          eq(role.name, "super-admin"),
        ),
      );

    console.log(
      `   Super admin check with role name:`,
      superAdminCheckWithRole,
    );
  }

  console.log("\n=== Test Complete ===");
}

testGetOrganizations()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });
