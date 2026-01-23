import { requireAuth } from "~/server/auth/session.server";
import { requirePermission } from "~/server/auth/permissions.server";
import { usersRepository } from "../repository";

/**
 * Update a member's single role (sets a single role, replacing all existing)
 */
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

    // Update the member's roles (set single role)
    await usersRepository.setMemberRoles(memberId, [newRoleId]);

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

/**
 * Update a member's roles (many-to-many)
 */
export async function updateMemberRoles(
  request: Request,
  memberId: string,
  roleIds: string[],
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

    // Update the member's roles
    await usersRepository.setMemberRoles(memberId, roleIds);

    return {
      success: true,
      message: "User roles updated successfully",
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to update user roles",
    };
  }
}

/**
 * Add a role to a member
 */
export async function addRoleToMember(
  request: Request,
  memberId: string,
  roleId: string,
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

    // Add role to member
    await usersRepository.addRoleToMember(memberId, roleId);

    return {
      success: true,
      message: "Role added successfully",
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to add role",
    };
  }
}

/**
 * Remove a role from a member
 */
export async function removeRoleFromMember(
  request: Request,
  memberId: string,
  roleId: string,
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

    // Remove role from member
    await usersRepository.removeRoleFromMember(memberId, roleId);

    return {
      success: true,
      message: "Role removed successfully",
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to remove role",
    };
  }
}
