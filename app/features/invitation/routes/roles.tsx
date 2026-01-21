import { eq } from 'drizzle-orm'
import { requireAuth } from '~/server/auth/session.server'
import { db } from '~/server/db'
import { roleModel } from '~/server/db/schemas/auth'
import type { Route } from './+types/roles'

/**
 * Resource route for fetching roles by organization
 * Used by the invitation wizard to dynamically load roles when organization changes
 */
export async function loader({ request }: Route.LoaderArgs) {
  await requireAuth(request)

  const url = new URL(request.url)
  const organizationId = url.searchParams.get('organizationId')

  if (!organizationId) {
    return { roles: [] }
  }

  const roles = await db
    .select({
      id: roleModel.id,
      name: roleModel.name,
      description: roleModel.description,
      isSystem: roleModel.isSystem,
    })
    .from(roleModel)
    .where(eq(roleModel.organizationId, organizationId))

  return { roles }
}
