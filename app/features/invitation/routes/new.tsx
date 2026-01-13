import { and, eq } from "drizzle-orm";
import { redirect, useNavigate } from "react-router";
import auth from "~/server/auth-server";
import {
  requireOrganization,
  requireOrganizationAdmin,
} from "~/server/auth/organization.server";
import { requirePermission } from "~/server/auth/permissions.server";
import { requireAuth } from "~/server/auth/session.server";
import { db } from "~/server/db";
import {
  invitationModel,
  permissionModel,
  roleModel,
  rolePermissionModel,
} from "~/server/db/schemas/auth";
import { InvitationWizard } from "../components/InvitationWizard";
import type { PermissionData, RoleData } from "../types";
import type { Route } from "./+types/new";

export async function loader({ request }: Route.LoaderArgs) {
  const session = await requireAuth(request);
  const { organization } = await requireOrganizationAdmin(session);

  // Check permission to invite users
  // await requirePermission(session.user.id, organization.id, "user:create");

  // Get all roles for this organization
  const roles = await db
    .select()
    .from(roleModel)
    .where(eq(roleModel.organizationId, organization.id));

  // Get all permissions
  const permissions = await db.select().from(permissionModel);

  return { organization, roles, permissions };
}

export async function action({ request }: Route.ActionArgs) {
  const session = await requireAuth(request);
  const { organization } = await requireOrganization(session);

  // Check permission
  await requirePermission(session.user.id, organization.id, "user:create");

  const formData = await request.formData();
  const data = JSON.parse(formData.get("data") as string);

  try {
    let roleId = data.roleId;

    // 1. Create custom role if needed
    if (data.createNewRole) {
      const newRoleId = crypto.randomUUID();

      await db.insert(roleModel).values({
        id: newRoleId,
        organizationId: organization.id,
        name: data.newRoleName,
        description: data.newRoleDescription || "",
        isSystem: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      roleId = newRoleId;

      // Assign permissions to new role
      if (data.selectedPermissions && data.selectedPermissions.length > 0) {
        await db.insert(rolePermissionModel).values(
          data.selectedPermissions.map((permId: string) => ({
            id: crypto.randomUUID(),
            roleId: newRoleId,
            permissionId: permId,
            organizationId: organization.id,
            createdAt: new Date(),
            updatedAt: new Date(),
          })),
        );
      }
    }

    // 2. Create custom permissions if any
    const customPermIds: string[] = [];
    if (data.customPermissions && data.customPermissions.length > 0) {
      for (const cp of data.customPermissions) {
        // Check if permission exists
        const [existingPerm] = await db
          .select()
          .from(permissionModel)
          .where(
            and(
              eq(permissionModel.resource, cp.resource),
              eq(permissionModel.action, cp.action),
            ),
          )
          .limit(1);

        if (existingPerm) {
          customPermIds.push(existingPerm.id);
        } else {
          // Create new permission
          const permId = crypto.randomUUID();
          await db.insert(permissionModel).values({
            id: permId,
            resource: cp.resource,
            action: cp.action,
            description: `Custom permission: ${cp.resource}:${cp.action}`,
            isSystem: false,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
          customPermIds.push(permId);
        }
      }
    }

    // 3. Get role name for invitation
    const [selectedRole] = await db
      .select()
      .from(roleModel)
      .where(eq(roleModel.id, roleId))
      .limit(1);

    // 4. Create invitation via Better Auth
    // Better Auth will automatically trigger the sendInvitationEmail callback
    const roleName = selectedRole?.name || "member";
    const invitationResponse = await auth.api.createInvitation({
      headers: request.headers,
      body: {
        organizationId: organization.id,
        email: data.email,
        role: roleName as "member" | "admin" | "owner",
      },
    });

    // Extract invitation ID from response
    const invitationData = invitationResponse as any as { id: string };
    const invitationId = invitationData.id;

    // 5. Update invitation with custom fields (roleId and customPermissions)
    await db
      .update(invitationModel)
      .set({
        roleId,
        customPermissions:
          customPermIds.length > 0 ? JSON.stringify(customPermIds) : null,
        inviterId: session.user.id,
      })
      .where(eq(invitationModel.id, invitationId));

    return redirect("/invitations");
  } catch (error) {
    console.error("Failed to create invitation:", error);
    return { error: "Failed to create invitation. Please try again." };
  }
}

export default function NewInvitation({
  loaderData,
  actionData,
}: Route.ComponentProps) {
  const { organization, roles, permissions } = loaderData;
  const navigate = useNavigate();

  // Map data to match wizard types
  const roleData: RoleData[] = roles.map((r) => ({
    id: r.id,
    name: r.name,
    description: r.description || null,
    isSystem: r.isSystem,
  }));

  const permissionData: PermissionData[] = permissions.map((p) => ({
    id: p.id,
    resource: p.resource,
    action: p.action,
    description: p.description || null,
    isSystem: p.isSystem,
  }));

  const handleSubmit = async (data: {
    email: string;
    name: string;
    roleId: string | null;
    createNewRole: boolean;
    newRoleName: string;
    newRoleDescription: string;
    selectedPermissions: string[];
    customPermissions: Array<{ resource: string; action: string }>;
  }) => {
    // Create a form and submit it
    const form = document.createElement("form");
    form.method = "POST";

    const input = document.createElement("input");
    input.type = "hidden";
    input.name = "data";
    input.value = JSON.stringify(data);
    form.appendChild(input);

    document.body.appendChild(form);
    form.submit();
  };

  return (
    <div className="p-6">
      <div className="mx-auto max-w-3xl">
        <h1 className="mb-2 text-2xl font-bold">Invite New User</h1>
        <p className="mb-6 text-sm text-muted-foreground">
          Send an invitation to join {organization.name}
        </p>

        {actionData?.error && (
          <div className="mb-4 rounded-lg border border-destructive bg-destructive/10 p-4 text-sm text-destructive">
            {actionData.error}
          </div>
        )}

        <InvitationWizard
          roles={roleData}
          permissions={permissionData}
          onSubmit={handleSubmit}
        />
      </div>
    </div>
  );
}
