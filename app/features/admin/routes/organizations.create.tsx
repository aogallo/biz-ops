import { useState } from "react";
import { useNavigate } from "react-router";
import type { Route } from "./+types/organizations.create";
import { requireAuth } from "~/server/auth/session.server";
import { requireOrganizationAdmin } from "~/server/auth/organization.server";
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
  FieldGroup,
  FieldLabel,
  FieldDescription,
} from "~/components/ui/field";
import { Input } from "~/components/ui/input";

export async function loader({ request }: Route.LoaderArgs) {
  const session = await requireAuth(request);

  // Require super admin (admin organization member)
  await requireOrganizationAdmin(session);

  return { user: session.user };
}

export default function CreateOrganizationPage({
  loaderData,
}: Route.ComponentProps) {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [logo, setLogo] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch("/api/organizations/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          slug,
          logo: logo || undefined,
        }),
      });

      const data = await response.json() as { success?: boolean; error?: string };

      if (!response.ok) {
        setError(data.error || "Failed to create organization");
        setIsLoading(false);
        return;
      }

      // Success! Redirect to organizations list or admin dashboard
      navigate("/admin/organizations");
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
      setIsLoading(false);
    }
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
          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="name">Organization Name *</FieldLabel>
                <Input
                  id="name"
                  type="text"
                  placeholder="Acme Corporation"
                  required
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  disabled={isLoading}
                />
                <FieldDescription>
                  The display name for the organization
                </FieldDescription>
              </Field>

              <Field>
                <FieldLabel htmlFor="slug">URL Slug *</FieldLabel>
                <Input
                  id="slug"
                  type="text"
                  placeholder="acme-corporation"
                  required
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  disabled={isLoading}
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
                  type="url"
                  placeholder="https://example.com/logo.png"
                  value={logo}
                  onChange={(e) => setLogo(e.target.value)}
                  disabled={isLoading}
                />
                <FieldDescription>
                  Optional URL for the organization's logo
                </FieldDescription>
              </Field>

              <div className="flex gap-3">
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Creating..." : "Create Organization"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/admin/organizations")}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
              </div>
            </FieldGroup>
          </form>
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
