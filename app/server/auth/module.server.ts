import { redirect } from 'react-router'
import { and, eq } from 'drizzle-orm'
import { db } from '~/server/db'
import { memberModel } from '~/server/db/schemas/auth'
import { modulesRepository } from '~/features/modules/server/repository'
import type { ModuleKey } from '~/features/modules/constants'
import { requireAuth } from './session.server'

/**
 * Guard that ensures the current user has access to a specific module.
 * Super admins bypass this check.
 * Throws a redirect to /home if access is denied.
 */
export async function requireModule(request: Request, moduleKey: ModuleKey): Promise<void> {
  const session = await requireAuth(request)

  // Super admin bypasses all module checks
  if (session.user.isSuperAdmin) return

  const organizationId = session.session.activeOrganizationId
  if (!organizationId) {
    throw redirect('/home')
  }

  // Get the member record for this user in the active org
  const [memberRow] = await db
    .select({ id: memberModel.id })
    .from(memberModel)
    .where(
      and(
        eq(memberModel.userId, session.user.id),
        eq(memberModel.organizationId, organizationId)
      )
    )
    .limit(1)

  if (!memberRow) {
    throw redirect('/home')
  }

  const accessLevel = await modulesRepository.getMemberAccessLevel(memberRow.id, moduleKey)

  if (accessLevel === 'none') {
    throw redirect('/home')
  }
}
