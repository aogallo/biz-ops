import { requireAuth } from "~/server/auth/session.server";
import { db } from "~/server/db";
import { isOrgAdmin, isSuperAdmin } from "~/server/permissions";
import { USER_MESSAGES } from "../../messages";
import { usersRepository } from "../repository";

export async function deleteUser(
  request: Request,
  memberId: string,
  organizationId: string
) {
  const session = await requireAuth(request);

  // Check permissions
  const isSuperAdminUser = await isSuperAdmin(session.user.id);
  const isOrgAdminUser = await isOrgAdmin(db, session.user.id, organizationId);

  if (!isSuperAdminUser && !isOrgAdminUser) {
    return {
      success: false,
      message: USER_MESSAGES.noPermission,
    };
  }

  try {
    await usersRepository.removeMember(memberId);
    return {
      success: true,
    };
  } catch (error) {
    console.error("Error removing user from organization:", error);
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to remove user",
    };
  }
}
