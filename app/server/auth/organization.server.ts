import { and, eq, sql } from 'drizzle-orm'
import { redirect } from 'react-router'
import auth from '~/server/auth-server'
import { db } from '~/server/db'
import {
  memberModel,
  memberRoleModel,
  organizationModel,
  roleModel,
} from '../db/schemas/auth'
import type { SessionData } from './session.server'

export interface OrganizationMember {
  id: string
  organizationId: string
  userId: string
  role: string // 'owner' | 'admin' | 'member' - Better Auth compatibility
  createdAt: Date
}

export interface Organization {
  id: string
  name: string
  slug: string
  logo: string | null
  createdAt: Date
}

/**
 * Require user to be a member of organization admin
 * Returns organization and memberships data
 */
export async function requireOrganizationAdmin(session: SessionData) {
  const [membership] = await db
    .select({
      member: memberModel,
      role: roleModel,
    })
    .from(memberModel)
    .innerJoin(memberRoleModel, eq(memberRoleModel.memberId, memberModel.id))
    .innerJoin(roleModel, eq(memberRoleModel.roleId, roleModel.id))
    .where(
      and(
        eq(memberModel.userId, session.user.id),
        eq(roleModel.name, 'super-admin')
      )
    )
    .limit(1)

  if (!membership) {
    return {
      success: false,
      message: 'You don"t have access to this operation',
    }
  }

  // Get organization
  const [org] = await db
    .select()
    .from(organizationModel)
    .where(eq(organizationModel.id, membership.member.organizationId))
    .limit(1)

  if (!org) {
    throw redirect('/organization')
  }

  return {
    organization: org,
    membership: {
      ...membership,
    },
  }
}

/**
 * Require user to be member of active organization
 * Returns organization and membership data
 */
export async function requireOrganization(
  session: SessionData
): Promise<{ organization: Organization; membership: OrganizationMember }> {
  if (!session.session.activeOrganizationId) {
    throw redirect('/organization', {
      headers: {
        'X-Message': 'Please select an organization',
      },
    })
  }

  // Get membership
  const [membership] = await db
    .select()
    .from(memberModel)
    .where(
      and(
        eq(memberModel.userId, session.user.id),
        eq(memberModel.organizationId, session.session.activeOrganizationId)
      )
    )
    .limit(1)

  if (!membership) {
    throw redirect('/organization', {
      headers: {
        'X-Message': "You don't have access to this organization",
      },
    })
  }

  // Get organization
  const [org] = await db
    .select()
    .from(organizationModel)
    .where(eq(organizationModel.id, session.session.activeOrganizationId))
    .limit(1)

  if (!org) {
    throw redirect('/organization')
  }

  return {
    organization: org,
    membership: {
      ...membership,
      role: membership.role || 'member',
    } as OrganizationMember,
  }
}

/**
 * Require specific role in organization
 */
export async function requireRole(
  session: SessionData,
  allowedRoles: string[]
): Promise<{ organization: Organization; membership: OrganizationMember }> {
  const data = await requireOrganization(session)

  if (!allowedRoles.includes(data.membership.role)) {
    throw redirect('/organization', {
      headers: {
        'X-Message': "You don't have permission for this action",
      },
    })
  }

  return data
}

/**
 * Get all organizations user is member of
 * If user is super admin, returns ALL organizations
 */
export async function getUserOrganizations(userId: string) {
  // Check if user is super admin (member of admin org with super_admin role)
  const superAdminCheck = await db
    .select({
      isSuperAdmin: organizationModel.isAdmin,
    })
    .from(memberModel)
    .innerJoin(
      organizationModel,
      eq(memberModel.organizationId, organizationModel.id)
    )
    .innerJoin(memberRoleModel, eq(memberRoleModel.memberId, memberModel.id))
    .innerJoin(roleModel, eq(memberRoleModel.roleId, roleModel.id))
    .where(
      and(
        eq(memberModel.userId, userId),
        eq(organizationModel.isAdmin, true),
        eq(roleModel.name, 'super-admin')
      )
    )
    .limit(1)

  const isSuperAdmin = superAdminCheck.length > 0

  if (isSuperAdmin) {
    // Super admin: return ALL organizations
    const allOrgs = await db
      .selectDistinct({
        organizationId: organizationModel.id,
        organizationName: organizationModel.name,
        slug: organizationModel.slug,
        logo: organizationModel.logo,
        createdAt: organizationModel.createdAt,
        roleName: sql<string>`'super-admin'`,
        isAdmin: organizationModel.isAdmin,
      })
      .from(organizationModel)
      .innerJoin(
        memberModel,
        eq(memberModel.organizationId, organizationModel.id)
      )

    // Return in same format but without membership data for non-member orgs
    return allOrgs.map((data) => ({
      membership: {
        id: '',
        organizationId: data.organizationId,
        userId: userId,
        role: data.roleName,
        createdAt: data.createdAt,
      },
      organization: {
        id: data.organizationId,
        name: data.organizationName,
        slug: data.slug,
        logo: data.logo,
        createdAt: data.createdAt,
        isAdmin: data.isAdmin,
      },
    }))
  }

  // Regular user: return only organizations they're members of
  const memberships = await db
    .select()
    .from(memberModel)
    .innerJoin(
      organizationModel,
      eq(organizationModel.id, memberModel.organizationId)
    )
    .where(eq(memberModel.userId, userId))

  // Transform the result to match expected structure
  return memberships.map((row) => ({
    membership: {
      id: row.member.id,
      organizationId: row.member.organizationId,
      userId: row.member.userId,
      role: row.member.role,
      createdAt: row.member.createdAt,
    },
    organization: {
      id: row.organization.id,
      name: row.organization.name,
      slug: row.organization.slug,
      logo: row.organization.logo,
      createdAt: row.organization.createdAt,
      isAdmin: row.organization.isAdmin,
    },
  }))
}

/**
 * Set active organization for a user session
 * If organizationId is not provided, sets the first organization the user is a member of
 */
export async function setActiveOrganization(
  request: Request,
  organizationId?: string
): Promise<void> {
  const session = await auth.api.getSession({
    headers: request.headers,
  })

  if (!session?.user) {
    throw new Error('User not authenticated')
  }

  let targetOrgId = organizationId

  // If no organization ID provided, get the first one
  if (!targetOrgId) {
    const memberships = await db
      .select({ organizationId: memberModel.organizationId })
      .from(memberModel)
      .where(eq(memberModel.userId, session.user.id))
      .limit(1)

    if (memberships.length === 0) {
      throw new Error('User is not a member of any organization')
    }

    targetOrgId = memberships[0].organizationId
  }

  // Set active organization using Better Auth
  await auth.api.setActiveOrganization({
    headers: request.headers,
    body: {
      organizationId: targetOrgId,
    },
  })
}

/**
 * Get the active organization ID from the session
 */
export async function getActiveOrganization(
  request: Request
): Promise<string | null> {
  const session = await auth.api.getSession({
    headers: request.headers,
  })

  return session?.session?.activeOrganizationId ?? null
}

// Re-export from organization-queries.server.ts for backward compatibility
// This breaks the circular import between auth-server.ts and this file
export { getInitialOrganization } from './organization-queries.server'
