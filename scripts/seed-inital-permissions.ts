import "dotenv/config";
import { and, eq } from "drizzle-orm";
import { db } from "../app/server/db";
import { permissionModel } from "../app/server/db/schemas/auth";

const SYSTEM_PERMISSIONS = [
  // Product permissions
  {
    resource: "product",
    action: "create",
    description: "Create new products",
  },
  { resource: "product", action: "read", description: "View products" },
  { resource: "product", action: "update", description: "Edit products" },
  { resource: "product", action: "delete", description: "Delete products" },

  // Invoice permissions
  { resource: "invoice", action: "create", description: "Create invoices" },
  { resource: "invoice", action: "read", description: "View invoices" },
  { resource: "invoice", action: "update", description: "Edit invoices" },
  { resource: "invoice", action: "delete", description: "Delete invoices" },
  { resource: "invoice", action: "export", description: "Export invoice data" },

  // User permissions
  { resource: "user", action: "create", description: "Invite users" },
  { resource: "user", action: "read", description: "View users" },
  { resource: "user", action: "update", description: "Edit user details" },
  { resource: "user", action: "delete", description: "Remove users" },

  // Order permissions
  { resource: "order", action: "create", description: "Create orders" },
  { resource: "order", action: "read", description: "View orders" },
  { resource: "order", action: "update", description: "Edit orders" },
  { resource: "order", action: "delete", description: "Delete orders" },

  // Settings permissions
  {
    resource: "settings",
    action: "manage",
    description: "Manage organization settings",
  },
  {
    resource: "settings",
    action: "view",
    description: "View organization settings",
  },

  // Report permissions
  { resource: "report", action: "view", description: "View reports" },
  { resource: "report", action: "create", description: "Create reports" },
  { resource: "report", action: "export", description: "Export reports" },

  // Role permissions (for RBAC menu)
  { resource: "role", action: "create", description: "Create roles" },
  { resource: "role", action: "read", description: "View roles" },
  { resource: "role", action: "update", description: "Edit roles" },
  { resource: "role", action: "delete", description: "Delete roles" },

  // Organization permissions (for Organization menu)
  {
    resource: "organization",
    action: "read",
    description: "View organization",
  },
  {
    resource: "organization",
    action: "update",
    description: "Edit organization settings",
  },
  {
    resource: "organization",
    action: "delete",
    description: "Delete organization",
  },

  // Business Partner permissions (for Business Partners menu)
  {
    resource: "business-partner",
    action: "create",
    description: "Create business partners",
  },
  {
    resource: "business-partner",
    action: "read",
    description: "View business partners",
  },
  {
    resource: "business-partner",
    action: "update",
    description: "Edit business partners",
  },
  {
    resource: "business-partner",
    action: "delete",
    description: "Delete business partners",
  },

  // Invitation permissions (for Invitations menu)
  {
    resource: "invitation",
    action: "create",
    description: "Send invitations",
  },
  {
    resource: "invitation",
    action: "read",
    description: "View invitations",
  },
  {
    resource: "invitation",
    action: "cancel",
    description: "Cancel invitations",
  },
];

async function main() {
  console.log("Seeding system permissions...");

  try {
    for (const perm of SYSTEM_PERMISSIONS) {
      const permissionId = crypto.randomUUID();

      // Check if permission already exists
      const [existing] = await db
        .select()
        .from(permissionModel)
        .where(
          and(
            eq(permissionModel.resource, perm.resource),
            eq(permissionModel.action, perm.action),
          ),
        )
        .limit(1);

      if (existing) {
        console.log(
          `  ⏭️  Skipping ${perm.resource}:${perm.action} (already exists)`,
        );
        continue;
      }

      await db.insert(permissionModel).values({
        id: permissionId,
        resource: perm.resource,
        action: perm.action,
        description: perm.description,
        isSystem: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      console.log(`  ✅ Created permission: ${perm.resource}:${perm.action}`);
    }

    console.log("\n✨ System permissions seeded successfully!");
  } catch (error) {
    console.error("❌ Error seeding permissions:", error);
    throw error;
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
