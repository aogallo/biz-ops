import { requireAuth } from "~/server/auth/session.server";
import { createBusinessPartnerSchema } from "../../schemas";
import { businessPartnersRepository } from "../repository";

export async function createBusinessPartner(request: Request) {
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

  // Check email uniqueness if provided
  if (result.data.email) {
    const emailExists = await businessPartnersRepository.existsByEmail(
      organizationId,
      result.data.email,
    );

    if (emailExists) {
      return {
        success: false,
        message: `A business partner with email "${result.data.email}" already exists in your organization`,
      };
    }
  }

  // Create business partner
  try {
    const partner = await businessPartnersRepository.create(result.data);
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
          : "Failed to create business partner",
    };
  }
}
