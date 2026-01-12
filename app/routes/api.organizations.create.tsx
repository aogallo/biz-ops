import type { ActionFunctionArgs } from "react-router";
import { json } from "~/lib/response";
import { requireAuth } from "~/server/auth/session.server";
import { requireOrganizationAdmin } from "~/server/auth/organization.server";
import { db } from "~/server/db";
import { organization } from "~/server/db/schema";
import { createSystemRoles } from "~/server/auth/roles.server";

interface CreateOrganizationBody {
  name: string;
  slug: string;
  logo?: string;
}

/**
 * POST /api/organizations/create
 * Creates a new organization (admin organization members only)
 */
export async function action({ request }: ActionFunctionArgs) {
  // Require authentication
  const session = await requireAuth(request);

  // Require super admin (member of admin organization)
  await requireOrganizationAdmin(session);

  // Parse request body
  const body = (await request.json()) as CreateOrganizationBody;

  // Validate required fields
  if (!body.name || !body.slug) {
    return json(
      { error: "Name and slug are required" },
      { status: 400 }
    );
  }

  try {
    // Create organization
    const orgId = crypto.randomUUID();
    const [newOrg] = await db
      .insert(organization)
      .values({
        id: orgId,
        name: body.name,
        slug: body.slug,
        logo: body.logo || null,
        isAdmin: false, // Regular organizations are not admin orgs
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    // Create default roles for the organization
    await createSystemRoles(orgId);

    return json({
      success: true,
      organization: newOrg,
    });
  } catch (error: any) {
    // Handle duplicate slug error
    if (error.code === "23505") {
      return json(
        { error: "An organization with this slug already exists" },
        { status: 409 }
      );
    }

    console.error("Error creating organization:", error);
    return json(
      { error: "Failed to create organization" },
      { status: 500 }
    );
  }
}
