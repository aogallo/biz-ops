/**
 * Data Migration Script: Migrate existing role assignments to junction tables
 *
 * This script copies existing roleId assignments from:
 * - member.roleId -> member_role junction table
 * - invitation.roleId -> invitation_role junction table
 *
 * Run with: npx tsx scripts/migrate-roles-to-junction.ts
 */
import "dotenv/config";
import { and, eq, isNotNull } from "drizzle-orm";

import { db } from "../app/server/db";
import {
  invitationModel,
  invitationRoleModel,
  memberModel,
  memberRoleModel,
} from "../app/server/db/schemas/auth";

async function main() {
  console.log("🚀 Starting role junction migration...\n");

  try {
    // Migrate member roles
    console.log("📝 Migrating member roles...");
    const membersWithRoles = await db
      .select({
        id: memberModel.id,
        roleId: memberModel.roleId,
      })
      .from(memberModel)
      .where(isNotNull(memberModel.roleId));

    console.log(`   Found ${membersWithRoles.length} members with roles`);

    let memberRolesCreated = 0;
    for (const member of membersWithRoles) {
      if (!member.roleId) continue;

      // Check if junction already exists
      const existingJunction = await db
        .select()
        .from(memberRoleModel)
        .where(
          and(
            eq(memberRoleModel.memberId, member.id),
            eq(memberRoleModel.roleId, member.roleId)
          )
        )
        .limit(1);

      if (existingJunction.length === 0) {
        await db.insert(memberRoleModel).values({
          memberId: member.id,
          roleId: member.roleId,
        });
        memberRolesCreated++;
      }
    }

    console.log(`   ✅ Created ${memberRolesCreated} member_role records\n`);

    // Migrate invitation roles
    console.log("📝 Migrating invitation roles...");
    const invitationsWithRoles = await db
      .select({
        id: invitationModel.id,
        roleId: invitationModel.roleId,
      })
      .from(invitationModel)
      .where(isNotNull(invitationModel.roleId));

    console.log(`   Found ${invitationsWithRoles.length} invitations with roles`);

    let invitationRolesCreated = 0;
    for (const invitation of invitationsWithRoles) {
      if (!invitation.roleId) continue;

      // Check if junction already exists
      const existingJunction = await db
        .select()
        .from(invitationRoleModel)
        .where(
          and(
            eq(invitationRoleModel.invitationId, invitation.id),
            eq(invitationRoleModel.roleId, invitation.roleId)
          )
        )
        .limit(1);

      if (existingJunction.length === 0) {
        await db.insert(invitationRoleModel).values({
          invitationId: invitation.id,
          roleId: invitation.roleId,
        });
        invitationRolesCreated++;
      }
    }

    console.log(`   ✅ Created ${invitationRolesCreated} invitation_role records\n`);

    console.log("✨ Migration completed successfully!");
    console.log(`   Member roles migrated: ${memberRolesCreated}`);
    console.log(`   Invitation roles migrated: ${invitationRolesCreated}\n`);
  } catch (error) {
    console.error("\n❌ Error during migration:", error);
    throw error;
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
