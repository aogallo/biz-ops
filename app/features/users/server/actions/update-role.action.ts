import { requireAuth } from "~/server/auth/session.server";
import { requirePermission } from "~/server/auth/permissions.server";
import { usersRepository } from "../repository";

export async function updateMemberRole(
  request: Request,
  memberId: string,
  newRoleId: string,
) {
  const session = await requireAuth(request);
  const organizationId = session.session.activeOrganizationId;

  if (!organizationId) {
    return {
      success: false,
      message: "No organization selected",
    };
  }

  try {
    // Check if user has permission to update user roles
    await requirePermission(session.user.id, organizationId, "user:update");

    // Update the member's role
    await usersRepository.updateMemberRole(memberId, newRoleId);

    return {
      success: true,
      message: "User role updated successfully",
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to update user role",
    };
  }
}
