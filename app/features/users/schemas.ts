import { createInsertSchema, createSelectSchema } from 'drizzle-zod'
import { z } from 'zod'
import { invitationModel } from '~/server/db/schemas/auth'

// Base schemas from Drizzle
export const insertInvitationSchema = createInsertSchema(invitationModel)
export const selectInvitationSchema = createSelectSchema(invitationModel)

// Schema for sending invitation
export const inviteUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  organizationId: z.string().uuid('Invalid organization ID'),
  roleId: z.string().uuid('Invalid role ID').optional(),
})

// Schema for accepting invitation (on acceptance page)
export const acceptInvitationSchema = z
  .object({
    name: z.string().min(1, 'Name is required').max(255),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(128),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  })

// Type exports
export type InviteUserInput = z.infer<typeof inviteUserSchema>
export type AcceptInvitationInput = z.infer<typeof acceptInvitationSchema>
