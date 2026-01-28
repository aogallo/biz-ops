import { z } from 'zod'

/**
 * Schema for resending an invitation
 */
export const resendInvitationSchema = z.object({
  email: z.string().email('Invalid email address'),
  organizationId: z.string().uuid('Invalid organization ID'),
  roleName: z.enum(['member', 'admin', 'owner'], {
    message: 'Invalid role',
  }),
})

export type ResendInvitationInput = z.infer<typeof resendInvitationSchema>

/**
 * Schema for canceling an invitation
 */
export const cancelInvitationSchema = z.object({
  invitationId: z.string().uuid('Invalid invitation ID'),
})

export type CancelInvitationInput = z.infer<typeof cancelInvitationSchema>
