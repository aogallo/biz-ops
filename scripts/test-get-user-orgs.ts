import "dotenv/config";
import { getUserOrganizations } from "../app/server/auth/organization.server";
import { db } from "../app/server/db";
import { member } from "../app/server/db/schema";

async function testGetUserOrganizations() {
  console.log("=== Testing getUserOrganizations Function ===\n");

  // Get first user ID
  const [firstMember] = await db
    .select({ userId: member.userId })
    .from(member)
    .limit(1);

  if (!firstMember) {
    console.log("No members found in database");
    return;
  }

  console.log(`Testing with user ID: ${firstMember.userId}\n`);

  const orgs = await getUserOrganizations(firstMember.userId);

  console.log(`Result: Found ${orgs.length} organizations:`);
  orgs.forEach((org) => {
    console.log(`  - ${org.organization.name} (${org.organization.slug})`);
    console.log(`    Member role: ${org.membership.role}`);
  });

  console.log("\n=== Test Complete ===");
}

testGetUserOrganizations()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });
