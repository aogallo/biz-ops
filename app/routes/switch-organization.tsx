import { redirect } from "react-router";
import { setActiveOrganization } from "~/server/auth/organization.server";
import { requireAuth } from "~/server/auth/session.server";
import type { Route } from "./+types/switch-organization";

export async function action({ request }: Route.ActionArgs) {
  await requireAuth(request);
  const formData = await request.formData();
  const organizationId = formData.get("organizationId") as string;

  if (!organizationId) {
    return redirect("/");
  }

  // Set the active organization
  await setActiveOrganization(request, organizationId);

  // Redirect back to refresh with new organization context
  return redirect("/");
}
