import { requireAuth } from "~/server/auth/session.server";
import { createBusinessPartnerSchema } from "../../schemas";
import { businessPartnersRepository } from "../repository";

export async function updateBusinessPartner(
  request: Request,
  partnerId: string,
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
      message: "You don't have permission to update this business partner",
    };
  }

  // Parse form data
  const formData = await request.formData();
  const inputValues = {
    name: formData.get("name"),
    type: formData.get("type"),
    email: formData.get("email") || "",
    phone: formData.get("phone") || "",
    notes: formData.get("notes") || "",
    organizationId,
  };

  // Validate input
  const result = createBusinessPartnerSchema.safeParse(inputValues);
  if (!result.success) {
    return {
      success: false,
      message: "Validation failed",
      errors: result.error.flatten().fieldErrors,
    };
  }

  // Check email uniqueness within organization (excluding current partner)
  if (result.data.email) {
    const emailExists = await businessPartnersRepository.existsByEmail(
      organizationId,
      result.data.email,
      partnerId,
    );

    if (emailExists) {
      return {
        success: false,
        message: `A business partner with email "${result.data.email}" already exists in your organization`,
      };
    }
  }

  // Update business partner
  try {
    const partner = await businessPartnersRepository.update(
      partnerId,
      result.data,
    );
    if (!partner) {
      return {
        success: false,
        message: "Failed to update business partner",
      };
    }
    return {
      success: true,
      data: partner,
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to update business partner",
    };
  }
}
