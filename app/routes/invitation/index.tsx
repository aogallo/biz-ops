import { desc, eq } from 'drizzle-orm'
import { Link } from 'react-router'
import { InvitationList } from '~/features/invitation/components/InvitationList'
import { resendInvitationSchema } from '~/features/invitation/schemas'
import { getLocaleFromRequest, translateServer } from '~/i18n/translate.server'
import auth from '~/server/auth-server'
import { hasPermission } from '~/server/auth/permissions.server'
import { requireAuth } from '~/server/auth/session.server'
import { db } from '~/server/db'
import {
  invitationModel,
  invitationRoleModel,
  organizationModel,
  roleModel,
  userModel,
} from '~/server/db/schemas/auth'
import type { Route } from './+types/index'

export async function action({ request }: Route.ActionArgs) {
  const { user } = await requireAuth(request)
  const locale = getLocaleFromRequest(request)
  const formData = await request.formData()
  const intent = formData.get('intent')

  if (intent === 'resend') {
    const result = resendInvitationSchema.safeParse({
      email: formData.get('email'),
      organizationId: formData.get('organizationId'),
      roleName: formData.get('roleName'),
    })

    if (!result.success) {
      return {
        success: false,
        error: 'Invalid invitation data',
        fieldErrors: result.error.flatten().fieldErrors,
      }
    }

    // Check permissions
    const canResend = await hasPermission(
      user.id,
      result.data.organizationId,
      'invitation:create'
    )

    if (!user.isSuperAdmin && !canResend) {
      return {
        success: false,
        error: translateServer(locale, 'messages.common.noPermission'),
      }
    }

    try {
      await auth.api.createInvitation({
        headers: request.headers,
        body: {
          email: result.data.email,
          organizationId: result.data.organizationId,
          role: result.data.roleName,
          resend: true,
        },
      })

      return {
        success: true,
        message: 'Invitation resent successfully',
      }
    } catch (error) {
      console.error('Error resending invitation:', error)
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to resend invitation',
      }
    }
  }

  return { success: false, error: 'Unknown action' }
}

export async function loader({ request }: Route.LoaderArgs) {
  const {
    user,
    session: { activeOrganizationId = null },
  } = await requireAuth(request)

  const locale = getLocaleFromRequest(request)

  if (!activeOrganizationId) {
    return { success: false, message: translateServer(locale, 'messages.organization.notFound') }
  }

  // Validate permissions permissions:bulk
  const isValidatePermissions = await hasPermission(
    user.id,
    activeOrganizationId,
    'invitation:read'
  )

  if (!user.isSuperAdmin && isValidatePermissions) {
    return { success: false, message: translateServer(locale, 'messages.common.noPermission') }
  }

  const [organization] = await db
    .select()
    .from(organizationModel)
    .where(eq(organizationModel.id, activeOrganizationId))

  // Get all invitations for this organization (roles fetched via junction table below)
  const rawInvitations = await db
    .select({
      id: invitationModel.id,
      email: invitationModel.email,
      status: invitationModel.status,
      createdAt: invitationModel.createdAt,
      expiresAt: invitationModel.expiresAt,
      inviterName: userModel.name,
      organizationId: invitationModel.organizationId,
      roleId: roleModel.id,
      roleName: roleModel.name,
    })
    .from(invitationModel)
    .innerJoin(userModel, eq(invitationModel.inviterId, userModel.id))
    .innerJoin(
      invitationRoleModel,
      eq(invitationRoleModel.invitationId, invitationModel.id)
    )
    .innerJoin(roleModel, eq(roleModel.id, invitationRoleModel.roleId))
    // .where(eq(invitation.organizationId, organization.id))
    .orderBy(desc(invitationModel.createdAt))

  return { invitations: rawInvitations, organization }
}

export default function InvitationsIndex({ loaderData }: Route.ComponentProps) {
  const { invitations, organization } = loaderData

  return (
    <div className='p-6'>
      <div className='mb-6 flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-bold'>Team Invitations</h1>
          <p className='text-muted-foreground text-sm'>
            Manage invitations for {organization?.name}
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
