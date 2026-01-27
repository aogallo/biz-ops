import { and, eq } from 'drizzle-orm'
import { redirect } from 'react-router'
import { InvitationWizard } from '~/features/invitation/components/InvitationWizard'
import type {
  OrganizationData,
  PermissionData,
  RoleData,
} from '~/features/invitation/types'
import auth from '~/server/auth-server'
import { getUserOrganizations } from '~/server/auth/organization.server'
import { requirePermission } from '~/server/auth/permissions.server'
import { requireAuth } from '~/server/auth/session.server'
import { db } from '~/server/db'
import {
  invitationModel,
  invitationRoleModel,
  organizationModel,
  permissionModel,
  roleModel,
  rolePermissionModel,
} from '~/server/db/schemas/auth'
import { isSuperAdmin } from '~/server/permissions'
import type { Route } from './+types/new'

export async function loader({ request }: Route.LoaderArgs) {
  const session = await requireAuth(request)

  // Check if user is super admin and get organizations in parallel
  const [isSuperAdminUser, userOrganizations] = await Promise.all([
    isSuperAdmin(session.user.id),
    getUserOrganizations(session.user.id),
  ])

  // Filter out admin organizations for non-super admins
  const organizations: OrganizationData[] = userOrganizations
    .filter((org) => !org.organization.isAdmin)
    .map((org) => ({
      id: org.organization.id,
      name: org.organization.name,
      slug: org.organization.slug,
      logo: org.organization.logo,
      isAdmin: org.organization.isAdmin ?? false,
    }))

  // Determine default organization
  const defaultOrgId = isSuperAdminUser
    ? organizations[0]?.id || null
    : session.session.activeOrganizationId || organizations[0]?.id || null

  // If user has no organizations, redirect
  if (!defaultOrgId) {
    throw redirect('/organization', {
      headers: {
        'X-Message':
          'You need to be a member of an organization to invite users',
      },
    })
  }

  // Get roles for the default organization
  const roles = await db
    .select()
    .from(roleModel)
    .where(eq(roleModel.organizationId, defaultOrgId))

  // Get all permissions
  const permissions = await db.select().from(permissionModel)

  // Get default organization details
  const [defaultOrganization] = await db
    .select()
    .from(organizationModel)
    .where(eq(organizationModel.id, defaultOrgId))
    .limit(1)

  return {
    isSuperAdmin: isSuperAdminUser,
    organizations,
    defaultOrganization,
    roles,
    permissions,
  }
}

export async function action({ request }: Route.ActionArgs) {
  const session = await requireAuth(request)

  const formData = await request.formData()
  const data = JSON.parse(formData.get('data') as string)

  // Get organizationId from form data
  const organizationId = data.organizationId as string
  if (!organizationId) {
    return { error: 'Organization is required' }
  }

  // Check if user is super admin
  const isSuperAdminUser = await isSuperAdmin(session.user.id)

  // Non-super admins can only invite to their active organization
  if (!isSuperAdminUser) {
    if (organizationId !== session.session.activeOrganizationId) {
      return { error: 'You can only invite users to your active organization' }
    }
  }

  // Check permission
  await requirePermission(session.user.id, organizationId, 'user:create')

  try {
    // Collect all role IDs to assign
    const roleIds: string[] = [...(data.roleIds || [])]

    // 1. Create custom role if needed
    if (data.createNewRole) {
      const newRoleId = crypto.randomUUID()

      await db.insert(roleModel).values({
        id: newRoleId,
        organizationId: organizationId,
        name: data.newRoleName,
        description: data.newRoleDescription || '',
        isSystem: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      // Add the new role to the list
      roleIds.push(newRoleId)

      // Assign permissions to new role
      if (data.selectedPermissions && data.selectedPermissions.length > 0) {
        await db.insert(rolePermissionModel).values(
          data.selectedPermissions.map((permId: string) => ({
            id: crypto.randomUUID(),
            roleId: newRoleId,
            permissionId: permId,
            organizationId: organizationId,
            createdAt: new Date(),
            updatedAt: new Date(),
          }))
        )
      }
    }

    // 2. Create custom permissions if any
    const customPermIds: string[] = []
    if (data.customPermissions && data.customPermissions.length > 0) {
      for (const cp of data.customPermissions) {
        // Check if permission exists
        const [existingPerm] = await db
          .select()
          .from(permissionModel)
          .where(
            and(
              eq(permissionModel.resource, cp.resource),
              eq(permissionModel.action, cp.action)
            )
          )
          .limit(1)

        if (existingPerm) {
          customPermIds.push(existingPerm.id)
        } else {
          // Create new permission
          const permId = crypto.randomUUID()
          await db.insert(permissionModel).values({
            id: permId,
            resource: cp.resource,
            action: cp.action,
            description: `Custom permission: ${cp.resource}:${cp.action}`,
            isSystem: false,
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          customPermIds.push(permId)
        }
      }
    }

    // 3. Get role name for invitation (use first role's name)
    let roleName = 'member'
    if (roleIds.length > 0) {
      const [selectedRole] = await db
        .select()
        .from(roleModel)
        .where(eq(roleModel.id, roleIds[0]))
        .limit(1)
      if (selectedRole) {
        roleName = selectedRole.name
      }
    }

    // 4. Create invitation via Better Auth
    // Better Auth will automatically trigger the sendInvitationEmail callback
    const invitationResponse = await auth.api.createInvitation({
      headers: request.headers,
      body: {
        organizationId: organizationId,
        email: data.email,
        role: roleName as 'member' | 'admin' | 'owner',
      },
    })

    // Extract invitation ID from response
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const invitationData = invitationResponse as any as { id: string }
    const invitationId = invitationData.id

    // 5. Update invitation with custom fields (customPermissions)
    await db
      .update(invitationModel)
      .set({
        customPermissions:
          customPermIds.length > 0 ? JSON.stringify(customPermIds) : null,
        inviterId: session.user.id,
      })
      .where(eq(invitationModel.id, invitationId))

    // 6. Save roles to junction table for many-to-many relationship
    if (roleIds.length > 0) {
      await db.insert(invitationRoleModel).values(
        roleIds.map((roleId) => ({
          invitationId,
          roleId,
        }))
      )
    }

    return redirect('/invitations')
  } catch (error) {
    console.error('Failed to create invitation:', error)
    return { error: 'Failed to create invitation. Please try again.' }
  }
}

export default function NewInvitation({
  loaderData,
  actionData,
}: Route.ComponentProps) {
  const {
    isSuperAdmin: isSuperAdminUser,
    organizations,
    defaultOrganization,
    roles,
    permissions,
  } = loaderData

  // Map data to match wizard types
  const roleData: RoleData[] = roles.map((r) => ({
    id: r.id,
    name: r.name,
    description: r.description || null,
    isSystem: r.isSystem,
  }))

  const permissionData: PermissionData[] = permissions.map((p) => ({
    id: p.id,
    resource: p.resource,
    action: p.action,
    description: p.description || null,
    isSystem: p.isSystem,
  }))

  const handleSubmit = async (data: {
    organizationId: string
    email: string
    name: string
    roleIds: string[]
    createNewRole: boolean
    newRoleName: string
    newRoleDescription: string
    selectedPermissions: string[]
    customPermissions: Array<{ resource: string; action: string }>
  }) => {
    // Create a form and submit it
    const form = document.createElement('form')
    form.method = 'POST'

    const input = document.createElement('input')
    input.type = 'hidden'
    input.name = 'data'
    input.value = JSON.stringify(data)
    form.appendChild(input)

    document.body.appendChild(form)
    form.submit()
  }

  return (
    <div className='p-6'>
      <div className='mx-auto max-w-3xl'>
        <h1 className='mb-2 text-2xl font-bold'>Invite New User</h1>
        <p className='text-muted-foreground mb-6 text-sm'>
          Send an invitation to join your organization
        </p>

        {actionData?.error && (
          <div className='border-destructive bg-destructive/10 text-destructive mb-4 rounded-lg border p-4 text-sm'>
            {actionData.error}
          </div>
        )}

        <InvitationWizard
          organizations={organizations}
          isSuperAdmin={isSuperAdminUser}
          defaultOrganizationId={defaultOrganization?.id || null}
          initialRoles={roleData}
          permissions={permissionData}
          onSubmit={handleSubmit}
        />
      </div>
    </div>
  )
}
