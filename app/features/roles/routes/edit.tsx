import { Form, redirect, useActionData, useLoaderData, useNavigation } from "react-router";
import { Button } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";
import { requireAuth } from "~/server/auth/session.server";
import { redirectWithFlash } from "~/server/flash.server";
import { isSuperAdmin } from "~/server/permissions";
import type { Route } from "./+types/edit";
import { updateRole } from "../server/actions/update.action";
import { rolesRepository } from "../server/repository";
import { ROLE_MESSAGES } from "../messages";
import { ChevronDown } from "lucide-react";
import { useState } from "react";

export async function loader({ request, params }: Route.LoaderArgs) {
  const session = await requireAuth(request);

  const roleId = params.id;
  const role = await rolesRepository.getById(roleId);

  if (!role) {
    return redirectWithFlash("/roles", {
      type: "error",
      message: ROLE_MESSAGES.notFound,
    });
  }

  // Block editing system roles for non-super-admins
  const isSuperAdminUser = await isSuperAdmin(session.user.id);
  if (role.isSystem && !isSuperAdminUser) {
    return redirectWithFlash("/roles", {
      type: "error",
      message: ROLE_MESSAGES.systemRoleProtected,
    });
  }

  const [permissions, currentPermissions] = await Promise.all([
    rolesRepository.getAllPermissions(),
    rolesRepository.getRolePermissions(roleId),
  ]);

  // Group permissions by resource
  const permissionsByResource = permissions.reduce((acc, perm) => {
    if (!acc[perm.resource]) {
      acc[perm.resource] = [];
    }
    acc[perm.resource].push(perm);
    return acc;
  }, {} as Record<string, typeof permissions>);

  const currentPermissionIds = currentPermissions.map((p) => p.id);

  return {
    role,
    permissionsByResource,
    currentPermissionIds,
  };
}

export async function action({ request, params }: Route.ActionArgs) {
  const roleId = params.id;
  const response = await updateRole(request, roleId);

  if (response.success && response.data) {
    return redirectWithFlash(`/roles/${roleId}`, {
      type: "success",
      message: ROLE_MESSAGES.updated,
    });
  }

  return response;
}

function PermissionSection({
  resource,
  perms,
  currentPermissionIds,
}: {
  resource: string;
  perms: Array<{ id: string; action: string; description: string | null }>;
  currentPermissionIds: string[];
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b last:border-b-0">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between rounded-md px-3 py-2 text-sm font-medium hover:bg-accent"
      >
        <span className="capitalize">
          {resource} ({perms.length})
        </span>
        <ChevronDown
          className={`h-4 w-4 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>
      <div className={`space-y-2 px-3 py-2 ${isOpen ? "" : "hidden"}`}>
        {perms.map((perm) => (
          <div key={perm.id} className="flex items-start space-x-3">
            <Checkbox
              id={perm.id}
              name="permissionIds"
              value={perm.id}
              defaultChecked={currentPermissionIds.includes(perm.id)}
              className="mt-1"
            />
            <label
              htmlFor={perm.id}
              className="flex-1 cursor-pointer text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              <span className="font-medium">{perm.action}</span>
              {perm.description && (
                <p className="mt-1 text-xs text-muted-foreground">
                  {perm.description}
                </p>
              )}
            </label>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function EditRole() {
  const { role, permissionsByResource, currentPermissionIds } =
    useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  return (
    <div className="mx-auto max-w-3xl p-6">
      <h1 className="text-2xl font-bold mb-2">Edit Role</h1>
      <p className="text-muted-foreground mb-6">
        Update role details and permissions
      </p>

      <Form method="post" className="space-y-6">
        {actionData?.message && !actionData.success && (
          <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">
            {actionData.message}
          </div>
        )}

        <div>
          <label htmlFor="name" className="mb-2 block text-sm font-medium">
            Role Name *
          </label>
          <input
            type="text"
            id="name"
            name="name"
            required
            defaultValue={role.name}
            placeholder="project-manager"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          />
          {actionData?.errors?.name && (
            <p className="mt-1 text-xs text-destructive">
              {actionData.errors.name[0]}
            </p>
          )}
          <p className="mt-1 text-xs text-muted-foreground">
            Use lowercase letters and hyphens only (e.g., project-manager)
          </p>
        </div>

        <div>
          <label htmlFor="description" className="mb-2 block text-sm font-medium">
            Description *
          </label>
          <textarea
            id="description"
            name="description"
            required
            rows={3}
            defaultValue={role.description || ""}
            placeholder="Describe what this role can do..."
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          />
          {actionData?.errors?.description && (
            <p className="mt-1 text-xs text-destructive">
              {actionData.errors.description[0]}
            </p>
          )}
        </div>

        <div>
          <label className="mb-3 block text-sm font-medium">
            Permissions * (Select at least one)
          </label>
          {actionData?.errors?.permissionIds && (
            <p className="mb-2 text-xs text-destructive">
              {actionData.errors.permissionIds[0]}
            </p>
          )}
          <div className="rounded-lg border">
            {Object.entries(permissionsByResource).map(([resource, perms]) => (
              <PermissionSection
                key={resource}
                resource={resource}
                perms={perms}
                currentPermissionIds={currentPermissionIds}
              />
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Updating..." : "Update Role"}
          </Button>
          <Button type="button" variant="outline" asChild>
            <a href={`/roles/${role.id}`}>Cancel</a>
          </Button>
        </div>
      </Form>
    </div>
  );
}
