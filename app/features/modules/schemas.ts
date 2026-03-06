import { z } from 'zod'
import { APP_MODULES } from './constants'

export const moduleKeySchema = z.enum(APP_MODULES)
export const moduleAccessLevelSchema = z.enum(['none', 'user', 'admin'])

export const toggleOrgModuleSchema = z.object({
  organizationId: z.string().uuid(),
  moduleKey: moduleKeySchema,
  isActive: z
    .string()
    .transform((v) => v === 'true')
    .or(z.boolean()),
})

export const setMemberModuleAccessSchema = z.object({
  memberId: z.string().uuid(),
  organizationId: z.string().uuid(),
  access: z.record(moduleKeySchema, moduleAccessLevelSchema),
})

export type ToggleOrgModuleInput = z.infer<typeof toggleOrgModuleSchema>
export type SetMemberModuleAccessInput = z.infer<
  typeof setMemberModuleAccessSchema
>
