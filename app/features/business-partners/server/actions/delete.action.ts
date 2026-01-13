import { requireAuth } from "~/server/auth/session.server";
import { businessPartnersRepository } from "../repository";

export async function deleteBusinessPartner(
  request: Request,
  partnerId: string
) {
  // Authenticate user
  const session = await requireAuth(request);

  // Get active organization from session
  const organizationId = session.session.activeOrganizationId;
  if (!organizationId) {
    return {
      success: false,
      message: "No active organization selected",
    };
  }

  // Verify partner exists and belongs to organization
  const existingPartner = await businessPartnersRepository.getById(partnerId);
  if (!existingPartner) {
    return {
      success: false,
      message: "Business partner not found",
    };
  }

  if (existingPartner.organizationId !== organizationId) {
    return {
      success: false,
      message: "You don't have permission to delete this business partner",
    };
  }

  // Delete business partner
  try {
    const deleted = await businessPartnersRepository.delete(partnerId);
    if (!deleted) {
      return {
        success: false,
        message: "Failed to delete business partner",
      };
    }
    return {
      success: true,
      message: "Business partner deleted successfully",
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to delete business partner",
    };
  }
}
