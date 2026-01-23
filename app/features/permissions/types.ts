import { createInsertSchema, createSelectSchema } from 'drizzle-zod'
import type z from 'zod'
import { permissionModel } from '~/server/db/schemas/auth'

export const selectPermissionSchema = createSelectSchema(permissionModel)
export const insertPermissionSchema = createInsertSchema(permissionModel).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
})

export type Permission = z.infer<typeof selectPermissionSchema>
export type CreatePermission = z.infer<typeof insertPermissionSchema>
