import { createInsertSchema, createSelectSchema } from 'drizzle-zod'
import { z } from 'zod'
import { permissionModel, roleModel } from '~/server/db/schemas/auth'

// Base schemas from Drizzle
export const insertRoleSchema = createInsertSchema(roleModel, {
  // Enhance with custom validation in the schema definition
  name: z
    .string()
    .min(3, 'Role name must be at least 3 characters')
    .max(50, 'Role name must not exceed 50 characters')
    .regex(/^[a-z-]+$/, 'Role name must be lowercase letters and hyphens only'),
  description: z
    .string()
    .min(1, 'Description is required')
    .max(200, 'Description must not exceed 200 characters'),
})

export const selectRoleSchema = createSelectSchema(roleModel)
export const selectPermissionSchema = createSelectSchema(permissionModel)

// Extend for creation (omit auto-generated fields)
export const createRoleSchema = insertRoleSchema
  .omit({ id: true, createdAt: true, updatedAt: true, isSystem: true })
  .extend({
    permissionIds: z
      .array(z.string().uuid())
      .min(1, 'At least 1 permission required'),
  })

// Extend for updates (all optional except organizationId)
export const updateRoleSchema = insertRoleSchema
  .partial()
  .required({ organizationId: true })
  .omit({ id: true, createdAt: true, updatedAt: true, isSystem: true })
  .extend({
    permissionIds: z
      .array(z.string().uuid())
      .min(1, 'At least 1 permission required'),
  })

// Type exports
export type CreateRoleInput = z.infer<typeof createRoleSchema>
export type UpdateRoleInput = z.infer<typeof updateRoleSchema>
export type Role = z.infer<typeof selectRoleSchema>
export type Permission = z.infer<typeof selectPermissionSchema>

// Helper type for role with permissions (for display)
export type RoleWithPermissions = Role & {
  permissions: Permission[]
}
