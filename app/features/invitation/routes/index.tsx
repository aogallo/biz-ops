import { desc, eq, inArray } from 'drizzle-orm'
import { Link } from 'react-router'
import { requireOrganizationAdmin } from '~/server/auth/organization.server'
import { requireAuth } from '~/server/auth/session.server'
import { db } from '~/server/db'
import { invitationModel, invitationRoleModel, roleModel, userModel } from '~/server/db/schemas/auth'
import { InvitationList } from '../components/InvitationList'
import type { InvitationRole, InvitationRow } from '../types'
import type { Route } from './+types/index'

export async function loader({ request }: Route.LoaderArgs) {
  const session = await requireAuth(request)
  const { organization } = await requireOrganizationAdmin(session)

  // Check permission to view users/invitations
  // await requirePermission(session.user.id, organization.id, "user:read");

  // Get all invitations for this organization
  const rawInvitations = await db
    .select({
      id: invitationModel.id,
      email: invitationModel.email,
      status: invitationModel.status,
      createdAt: invitationModel.createdAt,
      expiresAt: invitationModel.expiresAt,
      roleName: roleModel.name,
      roleId: invitationModel.roleId,
      inviterName: userModel.name,
    })
    .from(invitationModel)
    .leftJoin(roleModel, eq(invitationModel.roleId, roleModel.id))
    .innerJoin(userModel, eq(invitationModel.inviterId, userModel.id))
    // .where(eq(invitation.organizationId, organization.id))
    .orderBy(desc(invitationModel.createdAt))

  // Get all invitation IDs
  const invitationIds = rawInvitations.map((inv) => inv.id)

  // Fetch roles from junction table for all invitations
  let invitationRolesMap: Record<string, InvitationRole[]> = {}
  if (invitationIds.length > 0) {
    const invitationRoles = await db
      .select({
        invitationId: invitationRoleModel.invitationId,
        roleId: roleModel.id,
        roleName: roleModel.name,
      })
      .from(invitationRoleModel)
      .innerJoin(roleModel, eq(invitationRoleModel.roleId, roleModel.id))
      .where(inArray(invitationRoleModel.invitationId, invitationIds))

    // Group roles by invitation ID
    invitationRolesMap = invitationRoles.reduce(
      (acc, ir) => {
        if (!acc[ir.invitationId]) {
          acc[ir.invitationId] = []
        }
        acc[ir.invitationId].push({
          id: ir.roleId,
          name: ir.roleName,
        })
        return acc
      },
      {} as Record<string, InvitationRole[]>
    )
  }

  // Map to typed InvitationRow with roles
  const invitations: InvitationRow[] = rawInvitations.map((inv) => ({
    ...inv,
    status: inv.status as 'pending' | 'accepted' | 'expired',
    roles: invitationRolesMap[inv.id] || [],
  }))

  return { invitations, organization }
}

export default function InvitationsIndex({ loaderData }: Route.ComponentProps) {
  const { invitations, organization } = loaderData

  return (
    <div className='p-6'>
      <div className='mb-6 flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-bold'>Team Invitations</h1>
          <p className='text-muted-foreground text-sm'>
            Manage invitations for {organization.name}
          </p>
        </div>
        <Link
          to='/invitations/new'
          className='bg-primary text-primary-foreground hover:bg-primary/90 rounded-md px-4 py-2 text-sm font-medium'
        >
          Invite User
        </Link>
      </div>

      <InvitationList invitations={invitations} />
    </div>
  )
}
