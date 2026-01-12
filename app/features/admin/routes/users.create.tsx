import { hashPassword } from "better-auth/crypto";
import { eq } from "drizzle-orm";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import {
  Form,
  Link,
  redirect,
  useActionData,
  useNavigation,
  useSearchParams,
} from "react-router";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Checkbox } from "~/components/ui/checkbox";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "~/components/ui/field";
import { Input } from "~/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import auth from "~/server/auth-server";
import { getUserOrganizations } from "~/server/auth/organization.server";
import {
  getRoleByName,
  getRolesByOrganization,
} from "~/server/auth/roles.server";
import { requireAuth } from "~/server/auth/session.server";
import { db } from "~/server/db";
import {
  account,
  invitation,
  member,
  organization,
  role,
  user,
} from "~/server/db/schema";
import { isOrgAdmin, isSuperAdmin } from "~/server/permissions";
import type { Route } from "./+types/users.create";

interface Role {
  id: string;
  name: string;
  description: string | null;
  isSystem: boolean;
}

export async function loader({ request }: Route.LoaderArgs) {
  const session = await requireAuth(request);
  const url = new URL(request.url);
  const organizationId = url.searchParams.get("organizationId");

  // Fetch data in parallel
  const [isSuperAdminUser, organizations] = await Promise.all([
    isSuperAdmin(session.user.id),
    getUserOrganizations(session.user.id),
  ]);

  // Default to first org if none selected
  const selectedOrgId = organizationId || organizations[0]?.organization.id;

  // Fetch roles for selected organization
  let roles: any[] = [];
  if (selectedOrgId) {
    roles = await getRolesByOrganization(selectedOrgId);
  }

  return {
    isSuperAdmin: isSuperAdminUser,
    organizations,
    roles,
    selectedOrganizationId: selectedOrgId,
    user: session.user,
  };
}

export async function action({ request }: Route.ActionArgs) {
  const session = await requireAuth(request);
  const formData = await request.formData();

  const organizationId = formData.get("organizationId") as string;
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const image = formData.get("image") as string;
  const roleId = formData.get("roleId") as string;
  const sendInvitation = formData.get("sendInvitation") === "on";

  // Validate required fields
  if (!name || !email || !organizationId || !password) {
    return { error: "Name, email, organization, and password are required" };
  }

  // Validate password length
  if (password.length < 8) {
    return { error: "Password must be at least 8 characters long" };
  }

  if (password.length > 128) {
    return { error: "Password must not exceed 128 characters" };
  }

  try {
    // Check permissions
    const isSuperAdminUser = await isSuperAdmin(session.user.id);
    const isOrgAdminUser = await isOrgAdmin(
      db,
      session.user.id,
      organizationId,
    );

    if (!isSuperAdminUser && !isOrgAdminUser) {
      return {
        error:
          "You don't have permission to create users for this organization",
      };
    }

    // Check if user already exists
    const [existingUser] = await db
      .select()
      .from(user)
      .where(eq(user.email, email))
      .limit(1);

    if (existingUser) {
      return { error: "A user with this email already exists" };
    }

    // Get target organization
    const [targetOrg] = await db
      .select()
      .from(organization)
      .where(eq(organization.id, organizationId))
      .limit(1);

    if (!targetOrg) {
      return { error: "Organization not found" };
    }

    // Create user
    const userId = crypto.randomUUID();
    const hashedPassword = await hashPassword(password);

    const [newUser] = await db
      .insert(user)
      .values({
        id: userId,
        name,
        email,
        image: image || null,
        emailVerified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    // Create account with password
    await db.insert(account).values({
      id: crypto.randomUUID(),
      accountId: userId,
      providerId: "credential",
      userId: userId,
      password: hashedPassword,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Determine role for the user
    let finalRoleId = roleId;
    if (!finalRoleId) {
      // Default to member role
      const memberRole = await getRoleByName(organizationId, "member");
      finalRoleId = memberRole?.id || "";
    }

    // Create membership
    await db.insert(member).values({
      id: crypto.randomUUID(),
      organizationId,
      userId: userId,
      role: "member",
      roleId: finalRoleId || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Send invitation email via Better Auth if requested
    if (sendInvitation) {
      try {
        // Get role name for the invitation
        let roleName = "member";
        if (finalRoleId) {
          const [roleRecord] = await db
            .select()
            .from(role)
            .where(eq(role.id, finalRoleId))
            .limit(1);
          if (roleRecord) {
            roleName = roleRecord.name;
          }
        }

        // Create invitation via Better Auth
        const invitationResponse = await auth.api.createInvitation({
          headers: request.headers,
          body: {
            organizationId: organizationId,
            email: email,
            role: roleName as "member" | "admin" | "owner",
          },
        });

        const invitationData = invitationResponse as any as { id: string };
        const invitationId = invitationData.id;

        // Update invitation with roleId
        if (finalRoleId && invitationId) {
          await db
            .update(invitation)
            .set({
              roleId: finalRoleId,
              inviterId: session.user.id,
            })
            .where(eq(invitation.id, invitationId));
        }
      } catch (emailError) {
        console.error("Failed to send invitation email:", emailError);
        // Don't fail the user creation if email fails
      }
    }

    return redirect("/admin/users");
  } catch (error: any) {
    console.error("Error creating user:", error);
    return { error: "Failed to create user" };
  }
}

export default function CreateUserPage({ loaderData }: Route.ComponentProps) {
  const { isSuperAdmin, organizations, roles, selectedOrganizationId } =
    loaderData;
  const [searchParams, setSearchParams] = useSearchParams();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  const [showPassword, setShowPassword] = useState(false);

  // Check if user has organizations
  if (organizations.length === 0) {
    return (
      <div className="container mx-auto py-6 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>No Organizations Available</CardTitle>
            <CardDescription>
              You need to be a member of at least one organization to create
              users.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              <Link to="/admin/users">
                <Button>Back to Users</Button>
              </Link>
              {isSuperAdmin && (
                <Link to="/admin/organizations/create">
                  <Button variant="outline">Create Organization</Button>
                </Link>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Get default member role if available
  const memberRole = roles.find((r) => r.name === "member");
  const defaultRoleId = memberRole?.id || "";

  return (
    <div className="container mx-auto py-6 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Create New User</h1>
        <p className="text-muted-foreground">
          Add a new user to an organization with invitation email
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>User Details</CardTitle>
          <CardDescription>
            Enter the details for the new user. An invitation email will be sent
            with login credentials.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {actionData?.error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive mb-4">
              {actionData.error}
            </div>
          )}

          <Form method="post">
            <input
              type="hidden"
              name="organizationId"
              value={selectedOrganizationId || ""}
            />

            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="organization">Organization *</FieldLabel>
                <Select
                  value={selectedOrganizationId || ""}
                  onValueChange={(id) =>
                    setSearchParams({ organizationId: id })
                  }
                  disabled={!isSuperAdmin || isSubmitting}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select organization" />
                  </SelectTrigger>
                  <SelectContent>
                    {organizations.map((org) => (
                      <SelectItem
                        key={org.organization.id}
                        value={org.organization.id}
                      >
                        {org.organization.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {!isSuperAdmin && (
                  <FieldDescription>
                    You can only create users in your own organization
                  </FieldDescription>
                )}
              </Field>

              <Field>
                <FieldLabel htmlFor="name">Name *</FieldLabel>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="John Doe"
                  required
                  disabled={isSubmitting}
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="email">Email *</FieldLabel>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="john@example.com"
                  required
                  disabled={isSubmitting}
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="password">Password *</FieldLabel>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter password"
                    required
                    disabled={isSubmitting}
                    minLength={8}
                    maxLength={128}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                  </button>
                </div>
                <FieldDescription>
                  Must be 8-128 characters long. User will be prompted to change
                  this on first login.
                </FieldDescription>
              </Field>

              <Field>
                <FieldLabel htmlFor="role">Role</FieldLabel>
                <Select
                  name="roleId"
                  defaultValue={defaultRoleId}
                  disabled={isSubmitting}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select role (defaults to member)" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => (
                      <SelectItem key={role.id} value={role.id}>
                        <div>
                          <div className="font-medium">{role.name}</div>
                          {role.description && (
                            <div className="text-xs text-muted-foreground">
                              {role.description}
                            </div>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldDescription>
                  Optional. Defaults to "member" if not selected.
                </FieldDescription>
              </Field>

              <Field>
                <FieldLabel htmlFor="image">Profile Image URL</FieldLabel>
                <Input
                  id="image"
                  name="image"
                  type="url"
                  placeholder="https://example.com/avatar.jpg"
                  disabled={isSubmitting}
                />
                <FieldDescription>
                  Optional URL to the user's profile image
                </FieldDescription>
              </Field>

              <Field>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="sendInvitation"
                    name="sendInvitation"
                    defaultChecked={true}
                    disabled={isSubmitting}
                  />
                  <label
                    htmlFor="sendInvitation"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Send invitation email
                  </label>
                </div>
                <FieldDescription>
                  If checked, the user will receive an email with their login
                  credentials
                </FieldDescription>
              </Field>

              <div className="flex gap-3">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Creating..." : "Create User"}
                </Button>
                <Link to="/admin/users">
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
    </div>
  );
}
