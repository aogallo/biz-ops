import { Form, Link, useActionData, useNavigation } from "react-router";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { organizationRepository } from "~/features/organization/server/repository";
import { getRolesByOrganization } from "~/server/auth/roles.server";
import { requireAuth } from "~/server/auth/session.server";
import { redirectWithFlash } from "~/server/flash.server";
import { USER_MESSAGES } from "../messages";
import { inviteUser } from "../server/actions/invite.action";
import type { Route } from "./+types/invite";

export async function loader({ request }: Route.LoaderArgs) {
  const session = await requireAuth(request);
  const organizationId = session.session.activeOrganizationId;

  if (!organizationId) {
    return redirectWithFlash("/users", {
      type: "error",
      message: USER_MESSAGES.noOrganization,
    });
  }

  // Fetch roles for organization
  const roles = await getRolesByOrganization(organizationId);
  const organizations = await organizationRepository.getAll();

  return {
    organizations,
    roles,
  };
}

export async function action({ request }: Route.ActionArgs) {
  const response = await inviteUser(request);

  if (response.success) {
    return redirectWithFlash("/users", {
      type: "success",
      message: USER_MESSAGES.invited,
    });
  }

  return response;
}

export default function InviteUserPage({ loaderData }: Route.ComponentProps) {
  const { organizations, roles } = loaderData;
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  // Get default member role if available
  const memberRole = roles.find((r) => r.name === "member");
  const defaultRoleId = memberRole?.id || "";

  return (
    <div className="container mx-auto py-6 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Invite User</h1>
        <p className="text-muted-foreground">
          Send an invitation email to add a new user to your organization
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>User Invitation</CardTitle>
          <CardDescription>
            The user will receive an email with instructions to create their
            account
          </CardDescription>
        </CardHeader>
        <CardContent>
          {actionData?.message && !actionData.success && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive mb-4">
              {actionData.message}
            </div>
          )}

          <Form method="post">
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="email">Email *</FieldLabel>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="user@example.com"
                  required
                  disabled={isSubmitting}
                />
                <FieldDescription>
                  The email address where the invitation will be sent
                </FieldDescription>
                {actionData?.errors?.email && (
                  <p className="text-sm text-destructive mt-1">
                    {actionData.errors.email}
                  </p>
                )}
              </Field>
              <Field>
                <FieldLabel htmlFor="organization">Organization</FieldLabel>
                <Select name="organizationId" disabled={isSubmitting}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select organization" />
                  </SelectTrigger>
                  <SelectContent>
                    {organizations.map((organization) => (
                      <SelectItem key={organization.id} value={organization.id}>
                        {organization.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldDescription>
                  The organization the user will be invited to
                </FieldDescription>
                {actionData?.errors?.organizationId && (
                  <p className="text-sm text-destructive mt-1">
                    {actionData.errors.organizationId}
                  </p>
                )}
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
                        <div className="flex gap-4 items-center">
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
                  The role that will be assigned to the user in your
                  organization
                </FieldDescription>
                {actionData?.errors?.roleId && (
                  <p className="text-sm text-destructive mt-1">
                    {actionData.errors.roleId}
                  </p>
                )}
              </Field>

              <div className="flex gap-3">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Sending..." : "Send Invitation"}
                </Button>
                <Link to="/users">
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
