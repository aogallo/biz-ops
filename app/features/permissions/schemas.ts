import { createInsertSchema, createSelectSchema } from 'drizzle-zod'
import { z } from 'zod'
import { permissionModel } from '~/server/db/schemas/auth'

// Base schemas from Drizzle
export const selectPermissionSchema = createSelectSchema(permissionModel)
export const insertPermissionSchema = createInsertSchema(permissionModel, {
  resource: z
    .string()
    .min(2, 'Resource must be at least 2 characters')
    .max(50, 'Resource must not exceed 50 characters')
    .regex(
      /^[a-z][a-z0-9-_]*$/,
      'Resource must start with a letter and contain only lowercase letters, numbers, hyphens, and underscores'
    ),
  action: z
    .string()
    .min(2, 'Action must be at least 2 characters')
    .max(50, 'Action must not exceed 50 characters')
    .regex(
      /^[a-z][a-z0-9-_]*$/,
      'Action must start with a letter and contain only lowercase letters, numbers, hyphens, and underscores'
    ),
  description: z
    .string()
    .max(200, 'Description must not exceed 200 characters')
    .optional()
    .nullable(),
})

// Schema for creating a permission (omit auto-generated fields)
export const createPermissionSchema = insertPermissionSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  isSystem: true,
})

// Schema for updating a permission (all fields optional)
export const updatePermissionSchema = insertPermissionSchema
  .partial()
  .omit({ id: true, createdAt: true, updatedAt: true, isSystem: true })

// Type exports
export type Permission = z.infer<typeof selectPermissionSchema>
export type CreatePermissionInput = z.infer<typeof createPermissionSchema>
export type UpdatePermissionInput = z.infer<typeof updatePermissionSchema>
