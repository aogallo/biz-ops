import { eq } from 'drizzle-orm'
import auth from '~/server/auth-server'
import { getRoleByName } from '~/server/auth/roles.server'
import { requireAuth } from '~/server/auth/session.server'
import { db } from '~/server/db'
import { invitationModel, invitationRoleModel, roleModel } from '~/server/db/schemas/auth'
import { isOrgAdmin, isSuperAdmin } from '~/server/permissions'
import { USER_MESSAGES } from '../../messages'
import { inviteUserSchema } from '../../schemas'
import { usersRepository } from '../repository'

export async function inviteUser(request: Request) {
  const session = await requireAuth(request)
  const formData = await request.formData()

  // Parse and validate input
  const inputValues = {
    email: formData.get('email'),
    organizationId: formData.get('organizationId'),
    roleId: formData.get('roleId') || undefined,
  }

  const result = inviteUserSchema.safeParse(inputValues)
  if (!result.success) {
    return {
      success: false,
      message: 'Validation failed',
      errors: result.error.flatten().fieldErrors,
    }
  }

  const { email, organizationId, roleId } = result.data

  // Check permissions
  const isSuperAdminUser = await isSuperAdmin(session.user.id)
  const isOrgAdminUser = await isOrgAdmin(session.user.id, organizationId)

  if (!isSuperAdminUser && !isOrgAdminUser) {
    return {
      success: false,
      message: USER_MESSAGES.noPermission,
    }
  }

  // Check if user already exists
  const existingUser = await usersRepository.getByEmail(email)
  if (existingUser) {
    // Check if already a member
    const existingMember = await usersRepository.getMemberByUserId(
      existingUser.id,
      organizationId
    )
    if (existingMember) {
      return {
        success: false,
        message: USER_MESSAGES.alreadyMember,
      }
    }
    return {
      success: false,
      message: USER_MESSAGES.alreadyExists,
    }
  }

  // Determine role
  let finalRoleId = roleId
  let roleName = 'member'
  if (finalRoleId) {
    const [roleRecord] = await db
      .select()
      .from(roleModel)
      .where(eq(roleModel.id, finalRoleId))
      .limit(1)
    roleName = roleRecord?.name || 'member'
  } else {
    const memberRole = await getRoleByName(organizationId, 'member')
    finalRoleId = memberRole?.id
  }

  try {
    // Create invitation via Better Auth
    const invitation = await auth.api.createInvitation({
      headers: request.headers,
      body: {
        organizationId,
        email,
        role: roleName as 'member' | 'admin' | 'owner',
      },
    })

    const invitationId = invitation.id

    // Update invitation with inviter info
    if (invitationId) {
      await db
        .update(invitationModel)
        .set({
          inviterId: session.user.id,
        })
        .where(eq(invitationModel.id, invitationId))

      // Add role to junction table
      if (finalRoleId) {
        await db.insert(invitationRoleModel).values({
          invitationId,
          roleId: finalRoleId,
        })
      }
    }

    return {
      success: true,
      data: { invitationId, email },
    }
  } catch (error) {
    console.error('Error sending invitation:', error)
    return {
      success: false,
      message:
        error instanceof Error ? error.message : 'Failed to send invitation',
    }
  }
}
