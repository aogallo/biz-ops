import { Form, redirect, useActionData } from "react-router";
import type { Route } from "./+types/CreateOrganization";
import { requireAuth } from "~/server/auth/session.server";
import { db } from "~/server/db";
import { organization, member } from "~/server/db/schema";

export async function loader({ request }: Route.LoaderArgs) {
  await requireAuth(request);
  return {};
}

export async function action({ request }: Route.ActionArgs) {
  const session = await requireAuth(request);
  const formData = await request.formData();

  const name = formData.get("name") as string;
  const slug = formData.get("slug") as string;

  // Validate inputs
  if (!name || !slug) {
    return { error: "Name and slug are required" };
  }

  // Validate slug format (alphanumeric and hyphens only)
  if (!/^[a-z0-9-]+$/.test(slug)) {
    return { error: "Slug can only contain lowercase letters, numbers, and hyphens" };
  }

  try {
    // Create organization
    const [newOrg] = await db
      .insert(organization)
      .values({
        id: crypto.randomUUID(),
        name,
        slug,
        createdAt: new Date(),
      })
      .returning();

    // Make creator the owner
    // TODO: Update to use roleId after implementing role system
    await db.insert(member).values({
      id: crypto.randomUUID(),
      organizationId: newOrg.id,
      userId: session.user.id,
      role: "owner", // For Better Auth compatibility
      legacyRole: "owner", // Temporary: will be migrated to roleId
      createdAt: new Date(),
    });

    return redirect("/organization");
  } catch (error) {
    console.error("Error creating organization:", error);
    return { error: "Failed to create organization. The slug might already be taken." };
  }
}

export default function CreateOrganization() {
  const actionData = useActionData<typeof action>();

  return (
    <div className="self-stretch p-6">
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-6 text-2xl font-bold">Create New Organization</h1>

        <Form method="post" className="space-y-6">
          {actionData?.error && (
            <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">
              {actionData.error}
            </div>
          )}

          <div>
            <label
              htmlFor="name"
              className="mb-2 block text-sm font-medium"
            >
              Organization Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              required
              placeholder="Acme Corporation"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              The full name of your organization
            </p>
          </div>

          <div>
            <label
              htmlFor="slug"
              className="mb-2 block text-sm font-medium"
            >
              URL Slug
            </label>
            <input
              type="text"
              id="slug"
              name="slug"
              required
              placeholder="acme-corp"
              pattern="[a-z0-9-]+"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Lowercase letters, numbers, and hyphens only (e.g., acme-corp)
            </p>
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Create Organization
            </button>
            <a
              href="/organization"
              className="rounded-md border border-input px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
            >
              Cancel
            </a>
          </div>
        </Form>
      </div>
    </div>
  );
}
