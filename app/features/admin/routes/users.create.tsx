import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Eye, EyeOff } from "lucide-react";
import type { Route } from "./+types/users.create";
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
import { Checkbox } from "~/components/ui/checkbox";

interface Role {
  id: string;
  name: string;
  description: string | null;
  isSystem: boolean;
}

export async function loader({ request }: Route.LoaderArgs) {
  const session = await requireAuth(request);

  // Check if user is super admin
  const isSuperAdminUser = await isSuperAdmin(db, session.user.id);

  // Get user's organizations
  const organizations = await getUserOrganizations(session.user.id);

  console.log("Loader: isSuperAdmin =", isSuperAdminUser);
  console.log("Loader: organizations count =", organizations.length);

  return {
    isSuperAdmin: isSuperAdminUser,
    organizations,
    user: session.user,
  };
}

export default function CreateUserPage({ loaderData }: Route.ComponentProps) {
  const navigate = useNavigate();
  const { isSuperAdmin, organizations } = loaderData;

  // Check if user has organizations
  if (organizations.length === 0) {
    return (
      <div className="container mx-auto py-6 max-w-2xl">
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
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [image, setImage] = useState("");
  const [roleId, setRoleId] = useState<string>("");
  const [sendInvitation, setSendInvitation] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  // UI state
  const [roles, setRoles] = useState<Role[]>([]);
  const [loadingRoles, setLoadingRoles] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
        } else {
          console.error("Failed to fetch roles:", data.error);
        }
      } catch (error) {
        console.error("Error fetching roles:", error);
      } finally {
        setLoadingRoles(false);
      }
    };

    fetchRoles();
  }, [organizationId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    // Validation
    if (password.length < 8) {
      setError("Password must be at least 8 characters long");
      setIsSubmitting(false);
      return;
    }

    if (password.length > 128) {
      setError("Password must not exceed 128 characters");
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch("/api/users/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          organizationId,
          name,
          email,
          password,
          image: image || undefined,
          roleId: roleId || undefined,
          sendInvitation,
        }),
      });

      const data = await response.json() as { success?: boolean; error?: string; message?: string };

      if (!response.ok) {
        setError(data.error || "Failed to create user");
        setIsSubmitting(false);
        return;
      }

      // Success! Redirect to user list
      navigate("/admin/users");
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
      setIsSubmitting(false);
    }
  };

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
            Enter the details for the new user. An invitation email will be sent with login credentials.
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
                <FieldLabel htmlFor="name">Name *</FieldLabel>
                <Input
                  id="name"
                  type="text"
                  placeholder="John Doe"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isSubmitting}
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="email">Email *</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  placeholder="john@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isSubmitting}
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="password">Password *</FieldLabel>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
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
                  Must be 8-128 characters long. User will be prompted to change this on first login.
                </FieldDescription>
              </Field>

              <Field>
                <FieldLabel htmlFor="role">Role</FieldLabel>
                <Select
                  value={roleId}
                  onValueChange={setRoleId}
                  disabled={loadingRoles || isSubmitting}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={loadingRoles ? "Loading roles..." : "Select role (defaults to member)"} />
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
                  type="url"
                  placeholder="https://example.com/avatar.jpg"
                  value={image}
                  onChange={(e) => setImage(e.target.value)}
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
                    checked={sendInvitation}
                    onCheckedChange={(checked) =>
                      setSendInvitation(checked === true)
                    }
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
                  If checked, the user will receive an email with their login credentials
                </FieldDescription>
              </Field>

              <div className="flex gap-3">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Creating..." : "Create User"}
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
