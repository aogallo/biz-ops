import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Plus, Trash2, Download } from "lucide-react";
import type { Route } from "./+types/users.bulk-create";
import { requireAuth } from "~/server/auth/session.server";
import { getUserOrganizations } from "~/server/auth/organization.server";
import { isSuperAdmin } from "~/server/permissions";
import { db } from "~/server/db";
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
import { Checkbox } from "~/components/ui/checkbox";

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

  // Check if user is super admin
  const isSuperAdminUser = await isSuperAdmin(db, session.user.id);

  // Get user's organizations
  const organizations = await getUserOrganizations(session.user.id);

  return {
    isSuperAdmin: isSuperAdminUser,
    organizations,
    user: session.user,
  };
}

export default function BulkCreateUsersPage({
  loaderData,
}: Route.ComponentProps) {
  const navigate = useNavigate();
  const { isSuperAdmin, organizations } = loaderData;

  // Check if user has organizations
  if (organizations.length === 0) {
    return (
      <div className="container mx-auto py-6 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle>No Organizations Available</CardTitle>
            <CardDescription>
              You need to be a member of at least one organization to create users.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              <Button onClick={() => navigate("/admin/users")}>
                Back to Users
              </Button>
              {isSuperAdmin && (
                <Button variant="outline" onClick={() => navigate("/admin/organizations/create")}>
                  Create Organization
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Form state
  const [organizationId, setOrganizationId] = useState<string>(
    organizations[0].organization.id
  );
  const [roleId, setRoleId] = useState<string>("");
  const [sendInvitations, setSendInvitations] = useState(true);

  // User rows
  const [userRows, setUserRows] = useState<UserRow[]>([
    { id: crypto.randomUUID(), name: "", email: "", password: "", image: "" },
    { id: crypto.randomUUID(), name: "", email: "", password: "", image: "" },
    { id: crypto.randomUUID(), name: "", email: "", password: "", image: "" },
    { id: crypto.randomUUID(), name: "", email: "", password: "", image: "" },
    { id: crypto.randomUUID(), name: "", email: "", password: "", image: "" },
  ]);

  // UI state
  const [roles, setRoles] = useState<Role[]>([]);
  const [loadingRoles, setLoadingRoles] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<{
    created: number;
    failed: number;
    errors: Array<{ email: string; error: string }>;
  } | null>(null);

  // Fetch roles when organization changes
  useEffect(() => {
    if (!organizationId) return;

    const fetchRoles = async () => {
      setLoadingRoles(true);
      try {
        const params = new URLSearchParams({ organizationId });
        const response = await fetch(`/api/roles/list?${params}`);
        const data = await response.json() as { success?: boolean; roles?: Role[]; error?: string };

        if (data.success && data.roles) {
          setRoles(data.roles);
          // Auto-select "member" role if available
          const memberRole = data.roles.find((r) => r.name === "member");
          if (memberRole) {
            setRoleId(memberRole.id);
          }
        }
      } catch (error) {
        console.error("Error fetching roles:", error);
      } finally {
        setLoadingRoles(false);
      }
    };

    fetchRoles();
  }, [organizationId]);

  const addRow = () => {
    setUserRows([
      ...userRows,
      { id: crypto.randomUUID(), name: "", email: "", password: "", image: "" },
    ]);
  };

  const removeRow = (id: string) => {
    if (userRows.length <= 1) {
      setError("You must have at least one user row");
      return;
    }
    setUserRows(userRows.filter((row) => row.id !== id));
  };

  const updateRow = (id: string, field: keyof UserRow, value: string) => {
    setUserRows(
      userRows.map((row) => (row.id === id ? { ...row, [field]: value } : row))
    );
  };

  const validateRows = (): boolean => {
    // Filter out empty rows (rows where all fields are empty)
    const nonEmptyRows = userRows.filter(
      (row) =>
        row.name.trim() || row.email.trim() || row.password.trim() || row.image.trim()
    );

    if (nonEmptyRows.length === 0) {
      setError("Please add at least one user");
      return false;
    }

    // Validate each non-empty row
    for (const row of nonEmptyRows) {
      if (!row.name.trim()) {
        setError(`Name is required for user with email: ${row.email || "(empty)"}`);
        return false;
      }
      if (!row.email.trim()) {
        setError(`Email is required for user: ${row.name}`);
        return false;
      }
      if (!row.password.trim()) {
        setError(`Password is required for user: ${row.email}`);
        return false;
      }
      if (row.password.length < 8) {
        setError(
          `Password must be at least 8 characters for user: ${row.email}`
        );
        return false;
      }
      if (row.password.length > 128) {
        setError(
          `Password must not exceed 128 characters for user: ${row.email}`
        );
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResult(null);

    if (!validateRows()) {
      return;
    }

    setIsSubmitting(true);

    // Filter out empty rows
    const validUsers = userRows
      .filter((row) => row.name.trim() && row.email.trim() && row.password.trim())
      .map((row) => ({
        name: row.name.trim(),
        email: row.email.trim(),
        password: row.password,
        image: row.image.trim() || undefined,
        roleId: roleId || undefined,
      }));

    try {
      const response = await fetch("/api/users/bulk-create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          organizationId,
          users: validUsers,
          sendInvitations,
        }),
      });

      const data = await response.json() as {
        success?: boolean;
        created?: number;
        failed?: number;
        errors?: Array<{ email: string; error: string }>;
        error?: string;
      };

      if (!response.ok) {
        setError(data.error || "Failed to create users");
        setIsSubmitting(false);
        return;
      }

      // Show results
      setResult({
        created: data.created || 0,
        failed: data.failed || 0,
        errors: data.errors || [],
      });

      setIsSubmitting(false);
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
      setIsSubmitting(false);
    }
  };

  const downloadFailedUsers = () => {
    if (!result || result.errors.length === 0) return;

    const csv = ["email,error", ...result.errors.map((e) => `${e.email},${e.error}`)].join(
      "\n"
    );
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "failed-users.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  if (result) {
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
                <Button onClick={() => navigate("/admin/users")}>
                  Go to User List
                </Button>
                <Button variant="outline" onClick={() => setResult(null)}>
                  Create More Users
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
          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <FieldGroup>
              <div className="grid grid-cols-2 gap-4">
                <Field>
                  <FieldLabel htmlFor="organization">Organization *</FieldLabel>
                  <Select
                    value={organizationId}
                    onValueChange={setOrganizationId}
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
                  <FieldLabel htmlFor="role">Role (applies to all)</FieldLabel>
                  <Select
                    value={roleId}
                    onValueChange={setRoleId}
                    disabled={loadingRoles || isSubmitting}
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          loadingRoles
                            ? "Loading roles..."
                            : "Select role (defaults to member)"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map((role) => (
                        <SelectItem key={role.id} value={role.id}>
                          {role.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FieldDescription>
                    All users will be assigned this role
                  </FieldDescription>
                </Field>
              </div>

              <Field>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="sendInvitations"
                    checked={sendInvitations}
                    onCheckedChange={(checked) =>
                      setSendInvitations(checked === true)
                    }
                    disabled={isSubmitting}
                  />
                  <label
                    htmlFor="sendInvitations"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Send invitation emails to all users
                  </label>
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
                  Passwords must be 8-128 characters. Empty rows will be ignored.
                  Maximum 100 users per batch.
                </FieldDescription>
              </div>

              <div className="flex gap-3">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Creating Users..." : "Create All Users"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/admin/users")}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
              </div>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
