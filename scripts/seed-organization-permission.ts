import { db } from "../app/server/db";
import { permissionModel } from "../app/server/db/schemas/auth";

async function main() {
  try {
    console.log("Seeding organization permissions...");
    const permissions = [
      {
        resource: "organization",
        action: "update",
        description: "Update Organization",
      },
      {
        resource: "organization",
        action: "delete",
        description: "Delete Organization",
      },
      {
        resource: "organization",
        action: "view",
        description: "View Organization",
      },
    ];

    const existingPermissions = await db
      .insert(permissionModel)
      .values(permissions)
      .returning();

    console.log(`Inserted ${existingPermissions.length} permissions.`);
  } catch (error) {
    console.error("Error seeding organization permissions:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
