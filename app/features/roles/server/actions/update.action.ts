import { requireAuth } from "~/server/auth/session.server";
import { isOrgAdmin, isSuperAdmin } from "~/server/permissions";
import { db } from "~/server/db";
import { ROLE_MESSAGES } from "../../messages";
import { updateRoleSchema } from "../../schemas";
import { rolesRepository } from "../repository";

export async function updateRole(request: Request, roleId: string) {
  const session = await requireAuth(request);
  const formData = await request.formData();

  // Get role
  const role = await rolesRepository.getById(roleId);
  if (!role) {
    return {
      success: false,
      message: ROLE_MESSAGES.notFound,
    };
  }

  // Check if system role
  if (role.isSystem) {
    return {
      success: false,
      message: ROLE_MESSAGES.systemRoleProtected,
    };
  }

  // Check permissions
  const isSuperAdminUser = await isSuperAdmin(session.user.id);
  const isOrgAdminUser = await isOrgAdmin(db, session.user.id, role.organizationId);

  if (!isSuperAdminUser && !isOrgAdminUser) {
    return {
      success: false,
      message: ROLE_MESSAGES.systemRoleProtected,
    };
  }

  // Parse and validate input
  const permissionIds = formData.getAll("permissionIds") as string[];
  const inputValues = {
    name: formData.get("name"),
    description: formData.get("description"),
    organizationId: role.organizationId,
    permissionIds,
  };

  const result = updateRoleSchema.safeParse(inputValues);
  if (!result.success) {
    return {
      success: false,
      message: "Validation failed",
      errors: result.error.flatten().fieldErrors,
    };
  }

  const { name, description } = result.data;

  // Check name uniqueness (excluding current role)
  if (name) {
    const exists = await rolesRepository.existsByName(
      role.organizationId,
      name,
      roleId
    );
    if (exists) {
      return {
        success: false,
        message: ROLE_MESSAGES.nameExists,
      };
    }
  }

  try {
    // Update role
    await rolesRepository.update(roleId, { name, description });

    // Update permissions
    await rolesRepository.assignPermissions(
      roleId,
      result.data.permissionIds,
      role.organizationId
    );

    return {
      success: true,
      data: { roleId },
    };
  } catch (error) {
    console.error("Error updating role:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to update role",
    };
  }
}
