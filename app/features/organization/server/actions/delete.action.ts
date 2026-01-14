import auth from "~/server/auth-server";
import { requireAuth } from "~/server/auth/session.server";
import { organizationRepository } from "../repository";

export async function deleteOrganization(request: Request, slug: string) {
  // Authenticate user
  await requireAuth(request);

  const existingOrganzation = await organizationRepository.getBySlug(slug);

  if (!existingOrganzation) {
    return {
      success: false,
      message: "Organization not found",
    };
  }

  try {
    const data = await auth.api.deleteOrganization({
      body: { organizationId: existingOrganzation.id },
      headers: request.headers,
    });

    console.log("Organization deleted:", data?.id);

    return {
      success: true,
      message: "Organization deleted successfully",
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to delete organization",
    };
  }
}
