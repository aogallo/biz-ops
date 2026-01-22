/**
 * Organization queries that don't depend on auth-server.
 * This file breaks the circular import between auth-server.ts and organization.server.ts
 */

import { eq } from 'drizzle-orm'
import { db } from '~/server/db'
import { memberModel, organizationModel } from '../db/schemas/auth'

/**
 * Get the first organization user is member of
 * Used by auth-server.ts during session creation - must not import from auth-server.ts
 */
export async function getInitialOrganization(userId: string) {
  const memberships = await db
    .select()
    .from(memberModel)
    .innerJoin(
      organizationModel,
      eq(organizationModel.id, memberModel.organizationId)
    )
    .where(eq(memberModel.userId, userId))
    .limit(1)

  if (memberships.length === 0) {
    return {}
  }

  return {
    organization: memberships[0].organization,
  }
}
