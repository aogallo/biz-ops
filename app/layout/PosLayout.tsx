import { Outlet, redirect } from 'react-router'
import { AuthProvider } from '~/contexts/AuthContext'
import { organizationRepository } from '~/features/organization/server/repository'
import { getUserOrganizations } from '~/server/auth/organization.server'
import { requireAuth } from '~/server/auth/session.server'
import { isSuperAdmin } from '~/server/permissions'
import type { Route } from './+types/PosLayout'

export async function loader({ request }: Route.LoaderArgs) {
  const session = await requireAuth(request)
  const userId = session.user.id

  const isSuperAdminUser = await isSuperAdmin(userId)

  let organizations = []
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
    session,
    permissions: {
      list: [],
      isSuperAdmin: isSuperAdminUser,
    },
    organizations,
  }
}

export default function PosLayout({ loaderData }: Route.ComponentProps) {
  return (
    <AuthProvider
      value={{
        session: loaderData.session,
        permissions: loaderData.permissions,
        availableOrganizations: loaderData.organizations,
      }}
    >
      <div className='bg-background flex h-screen flex-col overflow-hidden'>
        <Outlet />
      </div>
    </AuthProvider>
  )
}
