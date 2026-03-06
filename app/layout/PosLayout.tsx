import { Outlet, redirect } from 'react-router'
import { AuthProvider } from '~/contexts/AuthContext'
import { organizationRepository } from '~/features/organization/server/repository'
import { getUserOrganizations } from '~/server/auth/organization.server'
import { getOptionalAuth } from '~/server/auth/session.server'
import { getPosSession } from '~/server/auth/pos-session.server'
import { isSuperAdmin } from '~/server/permissions'
import type { Route } from './+types/PosLayout'

export async function loader({ request }: Route.LoaderArgs) {
  const [userSession, posSession] = await Promise.all([
    getOptionalAuth(request),
    getPosSession(request),
  ])

  if (!userSession && !posSession) {
    throw redirect('/pos-login')
  }

  // POS cookie session — build minimal AuthProvider data
  if (!userSession && posSession) {
    return {
      session: {
        session: {
          userId: '',
          token: '',
          expiresAt: new Date(),
          activeOrganizationId: posSession.organizationId,
        },
        user: {
          id: '',
          email: '',
          emailVerified: false,
          name: posSession.cashierName,
          image: null,
          isSuperAdmin: false,
        },
      },
      permissions: { list: [], isSuperAdmin: false },
      organizations: [],
      posSession,
    }
  }

  // Better Auth session
  const userId = userSession!.user.id
  const isSuperAdminUser = await isSuperAdmin(userId)

  let organizations: Array<{ id: string; name: string; slug: string; isAdmin?: boolean; logo: string | null; createdAt: Date }> = []
  if (isSuperAdminUser) {
    organizations = await organizationRepository.getAll()
  } else {
    const userOrgs = await getUserOrganizations(userId)
    organizations = userOrgs.map((org) => ({
      id: org.organization.id,
      name: org.organization.name,
      slug: org.organization.slug,
      isAdmin: org.organization.isAdmin,
      logo: org.organization.logo,
      createdAt: org.organization.createdAt,
    }))
  }

  if (!isSuperAdminUser && organizations.length === 0) {
    throw redirect('/welcome')
  }

  return {
    session: userSession!,
    permissions: {
      list: [],
      isSuperAdmin: isSuperAdminUser,
    },
    organizations,
    posSession: null,
  }
}

export default function PosLayout({ loaderData }: Route.ComponentProps) {
  return (
    <AuthProvider
      value={{
        session: loaderData.session,
        permissions: loaderData.permissions,
        availableOrganizations: loaderData.organizations,
        moduleAccess: [],
      }}
    >
      <div className='bg-background flex h-screen flex-col overflow-hidden'>
        <Outlet />
      </div>
    </AuthProvider>
  )
}
