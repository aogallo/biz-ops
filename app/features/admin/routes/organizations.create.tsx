import { useState } from "react";
import {
  Form,
  Link,
  redirect,
  useActionData,
  useNavigation,
} from "react-router";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "~/components/ui/field";
import { Input } from "~/components/ui/input";
import { requireOrganizationAdmin } from "~/server/auth/organization.server";
import { createSystemRoles } from "~/server/auth/roles.server";
import { requireAuth } from "~/server/auth/session.server";
import { db } from "~/server/db";
import { organizationModel } from "~/server/db/schemas/auth";
import type { Route } from "./+types/organizations.create";

export async function loader({ request }: Route.LoaderArgs) {
  const session = await requireAuth(request);

  // Require super admin (admin organization member)
  await requireOrganizationAdmin(session);

  return { user: session.user };
}

export async function action({ request }: Route.ActionArgs) {
  const session = await requireAuth(request);
  await requireOrganizationAdmin(session);

  const formData = await request.formData();
  const name = formData.get("name") as string;
  const slug = formData.get("slug") as string;
  const logo = formData.get("logo") as string;

  // Validate required fields
  if (!name || !slug) {
    return { error: "Name and slug are required" };
  }

  try {
    // Create organization
    const orgId = crypto.randomUUID();
    const [newOrg] = await db
      .insert(organizationModel)
      .values({
        id: orgId,
        name,
        slug,
        logo: logo || null,
        isAdmin: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    // Create default roles for the organization
    await createSystemRoles(orgId);

    return redirect("/admin/organizations");
  } catch (error: any) {
    // Handle duplicate slug error
    if (error.code === "23505") {
      return { error: "An organization with this slug already exists" };
    }

    console.error("Error creating organization:", error);
    return { error: "Failed to create organization" };
  }
}

export default function CreateOrganizationPage({
  loaderData,
}: Route.ComponentProps) {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");

  // Auto-generate slug from name
  const handleNameChange = (value: string) => {
    setName(value);
    // Auto-generate slug: lowercase, replace spaces with hyphens, remove special chars
    const generatedSlug = value
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");
    setSlug(generatedSlug);
  };

  return (
    <div className="container mx-auto py-6 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Create New Organization</h1>
        <p className="text-muted-foreground">
          Create a new organization with default roles and permissions
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Organization Details</CardTitle>
          <CardDescription>
            Enter the details for the new organization
          </CardDescription>
        </CardHeader>
        <CardContent>
          {actionData?.error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive mb-4">
              {actionData.error}
            </div>
          )}

          <Form method="post">
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="name">Organization Name *</FieldLabel>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="Acme Corporation"
                  required
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  disabled={isSubmitting}
                />
                <FieldDescription>
                  The display name for the organization
                </FieldDescription>
              </Field>

              <Field>
                <FieldLabel htmlFor="slug">URL Slug *</FieldLabel>
                <Input
                  id="slug"
                  name="slug"
                  type="text"
                  placeholder="acme-corporation"
                  required
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  disabled={isSubmitting}
                />
                <FieldDescription>
                  A unique identifier for the organization (auto-generated from
                  name)
                </FieldDescription>
              </Field>

              <Field>
                <FieldLabel htmlFor="logo">Logo URL</FieldLabel>
                <Input
                  id="logo"
                  name="logo"
                  type="url"
                  placeholder="https://example.com/logo.png"
                  disabled={isSubmitting}
                />
                <FieldDescription>
                  Optional URL for the organization's logo
                </FieldDescription>
              </Field>

              <div className="flex gap-3">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Creating..." : "Create Organization"}
                </Button>
                <Link to="/admin/organizations">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                </Link>
              </div>
            </FieldGroup>
          </Form>
        </CardContent>
      </Card>

      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950 rounded-md">
        <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
          What happens when you create an organization?
        </h3>
        <ul className="list-disc list-inside space-y-1 text-sm text-blue-800 dark:text-blue-200">
          <li>A new organization is created with the specified details</li>
          <li>
            Default roles are automatically created (Owner, Admin, Member)
          </li>
          <li>System permissions are assigned to each role</li>
          <li>The organization is ready to have users added to it</li>
        </ul>
      </div>
    </div>
  );
}
