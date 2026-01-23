import { Outlet, redirect, useNavigation } from 'react-router'
import AppSidebar from '~/components/AppSidebar'
import { PageSkeleton } from '~/components/skeleton/PageSkeleton'
import SiteHeader from '~/components/SiteHeader'
import { SidebarProvider } from '~/components/ui/sidebar'
import { AuthProvider } from '~/contexts/AuthContext'
import type { Organization } from '~/features/organization/schemas'
import { getUserPermissions } from '~/server/auth/permissions.server'
import { requireAuth } from '~/server/auth/session.server'
import { isSuperAdmin } from '~/server/permissions'
import type { Route } from './+types/AppLayout'

// Add loader to require authentication and load permissions
export async function loader({ request }: Route.LoaderArgs) {
  const session = await requireAuth(request)
  const userId = session.user.id
  const organizationId = session.session.activeOrganizationId

  // Fetch permissions and super admin status in parallel
  const [permissions, isSuperAdminUser] = await Promise.all([
    organizationId
      ? getUserPermissions(userId, organizationId)
      : Promise.resolve([]),
    isSuperAdmin(userId),
  ])

  // Fetch all organizations for super admin, or just user's organizations
  let organizations: Organization[] = []
  if (isSuperAdminUser) {
    // Super admin sees ALL organizations
    const { db } = await import('~/server/db')
    const { organizationModel } = await import('~/server/db/schemas/auth')
    organizations = await db.select().from(organizationModel)
  } else {
    // Regular users see only their member organizations
    const { getUserOrganizations } =
      await import('~/server/auth/organization.server')
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

  // Redirect to welcome page if user has no organizations (and is not super admin)
  if (!isSuperAdminUser && organizations.length === 0) {
    throw redirect('/welcome')
  }

  return {
    session,
    permissions: {
      list: permissions,
      isSuperAdmin: isSuperAdminUser,
    },
    organizations,
  }
}

export default function AppLayout({ loaderData }: Route.ComponentProps) {
  const navigation = useNavigation()
  const isNavigating = navigation.state === 'loading'

  return (
    <AuthProvider
      value={{
        session: loaderData.session,
        permissions: loaderData.permissions,
        availableOrganizations: loaderData.organizations,
      }}
    >
      <SidebarProvider>
        <AppSidebar />
        <div className='flex min-h-screen flex-1 flex-col bg-background'>
          <SiteHeader />
          <main
            className='container mx-auto mt-1 gap-1 self-stretch p-6 px-4 py-6 lg:gap-2 lg:px-6'
            aria-busy={isNavigating}
          >
            {isNavigating ? <PageSkeleton /> : <Outlet />}
          </main>
        </div>
      </SidebarProvider>
    </AuthProvider>
  )
}
