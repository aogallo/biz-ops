import type { LoaderFunctionArgs } from "react-router";
import { json } from "~/lib/response";
import { requireAuth } from "~/server/auth/session.server";
import { getRolesByOrganization } from "~/server/auth/roles.server";

/**
 * GET /api/roles/list?organizationId=xxx
 * Lists roles for an organization
 */
export async function loader({ request }: LoaderFunctionArgs) {
  // Require authentication
  const session = await requireAuth(request);

  // Parse query parameters
  const url = new URL(request.url);
  const organizationId = url.searchParams.get("organizationId");

  if (!organizationId) {
    return json(
      { error: "organizationId is required" },
      { status: 400 }
    );
  }

  try {
    const roles = await getRolesByOrganization(organizationId);

    return json({
      success: true,
      roles: roles.map((role) => ({
        id: role.id,
        name: role.name,
        description: role.description,
        isSystem: role.isSystem,
      })),
    });
  } catch (error: any) {
    console.error("Error listing roles:", error);
    return json(
      { error: "Failed to list roles" },
      { status: 500 }
    );
  }
}
