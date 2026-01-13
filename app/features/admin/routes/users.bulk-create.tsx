import { hashPassword } from "better-auth/crypto";
import { eq } from "drizzle-orm";
import { Download, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { Form, redirect, useActionData, useNavigation } from "react-router";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import auth from "~/server/auth-server";
import { getUserOrganizations } from "~/server/auth/organization.server";
import { getRoleByName, getRolesByOrganization } from "~/server/auth/roles.server";
import { requireAuth } from "~/server/auth/session.server";
import { db } from "~/server/db";
import {
  accountModel,
  invitationModel,
  memberModel,
  organizationModel,
  roleModel,
  userModel,
} from "~/server/db/schemas/auth";
import { isOrgAdmin, isSuperAdmin } from "~/server/permissions";
import type { Route } from "./+types/users.bulk-create";

interface Role {
  id: string;
  name: string;
  description: string | null;
  isSystem: boolean;
}

interface UserRow {
  id: string;
  name: string;
  email: string;
  password: string;
  image: string;
}

export async function loader({ request }: Route.LoaderArgs) {
  const session = await requireAuth(request);
  const url = new URL(request.url);

  const organizationId = url.searchParams.get("organizationId");

  const [isSuperAdminUser, organizations] = await Promise.all([
    isSuperAdmin(session.user.id),
    getUserOrganizations(session.user.id),
  ]);

  // Default to first org if none selected
  const selectedOrgId = organizationId || organizations[0]?.organization.id;
  const roles = await getRolesByOrganization(selectedOrgId);

  return {
    isSuperAdmin: isSuperAdminUser,
    organizations,
    roles,
    selectedOrgId,
    user: session.user,
  };
}

export async function action({ request }: Route.ActionArgs) {
  const session = await requireAuth(request);
  const formData = await request.formData();

  const organizationId = formData.get("organizationId") as string;
  const roleId = formData.get("roleId") as string;
  const sendInvitations = formData.get("sendInvitations") === "true";
  const usersJson = formData.get("users") as string;

  // Validate required fields
  if (!organizationId) {
    return { error: "Organization is required" };
  }

  if (!usersJson) {
    return { error: "Users data is required" };
  }

  let users: Array<{
    name: string;
    email: string;
    password: string;
    image?: string;
  }>;

  try {
    users = JSON.parse(usersJson);
  } catch {
    return { error: "Invalid users data" };
  }

  if (!Array.isArray(users) || users.length === 0) {
    return { error: "Please add at least one user" };
  }

  if (users.length > 100) {
    return { error: "Cannot create more than 100 users at once" };
  }

  // Check permissions
  const isSuperAdminUser = await isSuperAdmin(session.user.id);
  const isOrgAdminUser = await isOrgAdmin(db, session.user.id, organizationId);

  if (!isSuperAdminUser && !isOrgAdminUser) {
    return {
      error: "You don't have permission to create users for this organization",
    };
  }

  // Get target organization
  const [targetOrg] = await db
    .select()
    .from(organizationModel)
    .where(eq(organizationModel.id, organizationId))
    .limit(1);

  if (!targetOrg) {
    return { error: "Organization not found" };
  }

  const result = {
    created: 0,
    failed: 0,
    errors: [] as Array<{ email: string; error: string }>,
  };

  // Process each user
  for (const userData of users) {
    try {
      // Validate user data
      if (!userData.name || !userData.email) {
        result.failed++;
        result.errors.push({
          email: userData.email || "unknown",
          error: "Name and email are required",
        });
        continue;
      }

      if (!userData.password) {
        result.failed++;
        result.errors.push({
          email: userData.email,
          error: "Password is required",
        });
        continue;
      }

      if (userData.password.length < 8) {
        result.failed++;
        result.errors.push({
          email: userData.email,
          error: "Password must be at least 8 characters",
        });
        continue;
      }

      if (userData.password.length > 128) {
        result.failed++;
        result.errors.push({
          email: userData.email,
          error: "Password must not exceed 128 characters",
        });
        continue;
      }

      // Check if user already exists
      const [existingUser] = await db
        .select()
        .from(userModel)
        .where(eq(userModel.email, userData.email))
        .limit(1);

      if (existingUser) {
        result.failed++;
        result.errors.push({
          email: userData.email,
          error: "User with this email already exists",
        });
        continue;
      }

      // Create user
      const userId = crypto.randomUUID();
      const hashedPassword = await hashPassword(userData.password);

      await db.insert(userModel).values({
        id: userId,
        name: userData.name,
        email: userData.email,
        emailVerified: false,
        image: userData.image || null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Create account
      await db.insert(accountModel).values({
        id: crypto.randomUUID(),
        accountId: userId,
        providerId: "credential",
        userId: userId,
        password: hashedPassword,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Determine role
      let finalRoleId: string | null = roleId || null;
      if (!finalRoleId) {
        const memberRole = await getRoleByName(organizationId, "member");
        finalRoleId = memberRole?.id || null;
      }

      // Create membership
      await db.insert(memberModel).values({
        id: crypto.randomUUID(),
        organizationId: organizationId,
        userId: userId,
        role: "member",
        roleId: finalRoleId || null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Send invitation via Better Auth if requested
      if (sendInvitations) {
        try {
          // Get role name for the invitation
          let roleName = "member";
          if (finalRoleId) {
            const [roleRecord] = await db
              .select()
              .from(roleModel)
              .where(eq(roleModel.id, finalRoleId))
              .limit(1);
            if (roleRecord) {
              roleName = roleRecord.name;
            }
          }

          // Create invitation via Better Auth (automatically sends email)
          const invitationResponse = await auth.api.createInvitation({
            headers: request.headers,
            body: {
              organizationId: organizationId,
              email: userData.email,
              role: roleName as "member" | "admin" | "owner",
            },
          });

          const invitationData = invitationResponse as any as { id: string };

          // Update invitation with roleId
          if (finalRoleId && invitationData.id) {
            await db
              .update(invitationModel)
              .set({
                roleId: finalRoleId,
                inviterId: session.user.id,
              })
              .where(eq(invitationModel.id, invitationData.id));
          }
        } catch (emailError) {
          console.error(
            `Failed to send invitation to ${userData.email}:`,
            emailError
          );
          // Don't fail the creation if email fails
        }
      }

      result.created++;
    } catch (error: any) {
      console.error(`Error creating user ${userData.email}:`, error);
      result.failed++;
      result.errors.push({
        email: userData.email,
        error: error.message || "Failed to create user",
      });
    }
  }

  // Return results without redirect to show the summary
  return { result };
}

export default function BulkCreateUsersPage({
  loaderData,
}: Route.ComponentProps) {
  const { isSuperAdmin, organizations, roles, selectedOrgId } = loaderData;
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  // Check if user has organizations
  if (organizations.length === 0) {
    return (
      <div className="container mx-auto py-6 max-w-4xl">
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
              <Button asChild>
                <a href="/admin/users">Back to Users</a>
              </Button>
              {isSuperAdmin && (
                <Button variant="outline" asChild>
                  <a href="/admin/organizations/create">Create Organization</a>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // User rows (controlled state for dynamic table)
  const [userRows, setUserRows] = useState<UserRow[]>([
    { id: crypto.randomUUID(), name: "", email: "", password: "", image: "" },
    { id: crypto.randomUUID(), name: "", email: "", password: "", image: "" },
    { id: crypto.randomUUID(), name: "", email: "", password: "", image: "" },
    { id: crypto.randomUUID(), name: "", email: "", password: "", image: "" },
    { id: crypto.randomUUID(), name: "", email: "", password: "", image: "" },
  ]);

  // Auto-select member role by default
  const memberRole = roles.find((r) => r.name === "member");
  const defaultRoleId = memberRole?.id || "";

  const addRow = () => {
    setUserRows([
      ...userRows,
      { id: crypto.randomUUID(), name: "", email: "", password: "", image: "" },
    ]);
  };

  const removeRow = (id: string) => {
    if (userRows.length <= 1) return;
    setUserRows(userRows.filter((row) => row.id !== id));
  };

  const updateRow = (id: string, field: keyof UserRow, value: string) => {
    setUserRows(
      userRows.map((row) => (row.id === id ? { ...row, [field]: value } : row)),
    );
  };

  const downloadFailedUsers = () => {
    if (!actionData?.result || actionData.result.errors.length === 0) return;

    const csv = [
      "email,error",
      ...actionData.result.errors.map((e) => `${e.email},${e.error}`),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "failed-users.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  // Show results if action completed successfully
  if (actionData?.result) {
    const { result } = actionData;
    return (
      <div className="container mx-auto py-6 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle>Bulk User Creation Results</CardTitle>
            <CardDescription>
              Summary of the bulk user creation operation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-green-50 dark:bg-green-950 rounded-md">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {result.created}
                  </div>
                  <div className="text-sm text-green-800 dark:text-green-200">
                    Users created successfully
                  </div>
                </div>
                <div className="p-4 bg-red-50 dark:bg-red-950 rounded-md">
                  <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                    {result.failed}
                  </div>
                  <div className="text-sm text-red-800 dark:text-red-200">
                    Users failed
                  </div>
                </div>
              </div>

              {result.errors.length > 0 && (
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-semibold">Failed Users</h3>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={downloadFailedUsers}
                    >
                      <Download className="size-4 mr-2" />
                      Download CSV
                    </Button>
                  </div>
                  <div className="border rounded-md">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Email</TableHead>
                          <TableHead>Error</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {result.errors.map((error, idx) => (
                          <TableRow key={idx}>
                            <TableCell>{error.email}</TableCell>
                            <TableCell className="text-red-600">
                              {error.error}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <Button asChild>
                  <a href="/admin/users">Go to User List</a>
                </Button>
                <Button variant="outline" asChild>
                  <a href="/admin/users/bulk-create">Create More Users</a>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Bulk Create Users</h1>
        <p className="text-muted-foreground">
          Create multiple users at once for an organization
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Bulk User Creation</CardTitle>
          <CardDescription>
            Enter details for multiple users. Empty rows will be ignored.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {actionData?.error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive mb-4">
              {actionData.error}
            </div>
          )}

          <Form
            method="post"
            onSubmit={(e) => {
              // Filter out empty rows and serialize users data
              const validUsers = userRows
                .filter(
                  (row) =>
                    row.name.trim() ||
                    row.email.trim() ||
                    row.password.trim() ||
                    row.image.trim()
                )
                .map((row) => ({
                  name: row.name.trim(),
                  email: row.email.trim(),
                  password: row.password,
                  image: row.image.trim() || undefined,
                }));

              // Add the serialized users data to the form
              const form = e.currentTarget;
              const hiddenInput = form.querySelector(
                'input[name="users"]'
              ) as HTMLInputElement;
              if (hiddenInput) {
                hiddenInput.value = JSON.stringify(validUsers);
              }
            }}
          >
            <FieldGroup>
              <input
                type="hidden"
                name="organizationId"
                value={selectedOrgId}
              />
              <input type="hidden" name="roleId" value={defaultRoleId} />
              <input type="hidden" name="sendInvitations" value="true" />
              <input type="hidden" name="users" value="" />

              <div className="grid grid-cols-2 gap-4">
                <Field>
                  <FieldLabel>Organization *</FieldLabel>
                  <div className="p-2 border rounded-md bg-muted">
                    {organizations.find((o) => o.organization.id === selectedOrgId)
                      ?.organization.name}
                  </div>
                  {!isSuperAdmin && (
                    <FieldDescription>
                      You can only create users in your own organization
                    </FieldDescription>
                  )}
                </Field>

                <Field>
                  <FieldLabel>Role (applies to all)</FieldLabel>
                  <div className="p-2 border rounded-md bg-muted">
                    {memberRole?.name || "member"}
                  </div>
                  <FieldDescription>
                    All users will be assigned this role
                  </FieldDescription>
                </Field>
              </div>

              <Field>
                <div className="flex items-center space-x-2">
                  <div className="p-2 text-sm">
                    Invitation emails will be sent to all users
                  </div>
                </div>
              </Field>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <FieldLabel>Users</FieldLabel>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={addRow}
                    disabled={isSubmitting}
                  >
                    <Plus className="size-4 mr-2" />
                    Add Row
                  </Button>
                </div>

                <div className="border rounded-md overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[200px]">Name *</TableHead>
                        <TableHead className="w-[200px]">Email *</TableHead>
                        <TableHead className="w-[150px]">Password *</TableHead>
                        <TableHead className="w-[200px]">
                          Image URL (Optional)
                        </TableHead>
                        <TableHead className="w-[60px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {userRows.map((row) => (
                        <TableRow key={row.id}>
                          <TableCell>
                            <Input
                              placeholder="John Doe"
                              value={row.name}
                              onChange={(e) =>
                                updateRow(row.id, "name", e.target.value)
                              }
                              disabled={isSubmitting}
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="email"
                              placeholder="john@example.com"
                              value={row.email}
                              onChange={(e) =>
                                updateRow(row.id, "email", e.target.value)
                              }
                              disabled={isSubmitting}
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="password"
                              placeholder="Password"
                              value={row.password}
                              onChange={(e) =>
                                updateRow(row.id, "password", e.target.value)
                              }
                              disabled={isSubmitting}
                              minLength={8}
                              maxLength={128}
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="url"
                              placeholder="https://..."
                              value={row.image}
                              onChange={(e) =>
                                updateRow(row.id, "image", e.target.value)
                              }
                              disabled={isSubmitting}
                            />
                          </TableCell>
                          <TableCell>
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              onClick={() => removeRow(row.id)}
                              disabled={isSubmitting || userRows.length <= 1}
                            >
                              <Trash2 className="size-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <FieldDescription className="mt-2">
                  Passwords must be 8-128 characters. Empty rows will be
                  ignored. Maximum 100 users per batch.
                </FieldDescription>
              </div>

              <div className="flex gap-3">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Creating Users..." : "Create All Users"}
                </Button>
                <Button type="button" variant="outline" asChild>
                  <a href="/admin/users">Cancel</a>
                </Button>
              </div>
            </FieldGroup>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
