import { Outlet, redirect, useLocation, useNavigation } from 'react-router'
import AppSidebar from '~/components/AppSidebar'
import SiteHeader from '~/components/SiteHeader'
import { PageSkeleton } from '~/components/skeleton/PageSkeleton'
import { SidebarProvider } from '~/components/ui/sidebar'
import { AuthProvider } from '~/contexts/AuthContext'
import type { Organization } from '~/features/organization/schemas'
import { organizationRepository } from '~/features/organization/server/repository'
import { getUserOrganizations } from '~/server/auth/organization.server'
import { productsRepository } from '~/features/products/server/repository'
import { getUserPermissions } from '~/server/auth/permissions.server'
import { requireAuth } from '~/server/auth/session.server'
import { isSuperAdmin } from '~/server/permissions'
import type { Route } from './+types/AppLayout'

// Add loader to require authentication and load permissions
export async function loader({ request }: Route.LoaderArgs) {
  const session = await requireAuth(request)
  const userId = session.user.id
  const organizationId = session.session.activeOrganizationId

  // Fetch permissions, super admin status, and low stock count in parallel
  const [permissions, isSuperAdminUser, lowStockCount] = await Promise.all([
    organizationId
      ? getUserPermissions(userId, organizationId)
      : Promise.resolve([]),
    isSuperAdmin(userId),
    organizationId
      ? productsRepository.countLowStock(organizationId)
      : Promise.resolve(0),
  ])

  // Fetch all organizations for super admin, or just user's organizations
  let organizations: Organization[] = []
  if (isSuperAdminUser) {
    // Super admin sees ALL organizations
    organizations = await organizationRepository.getAll()
  } else {
    // Regular users see only their member organizations
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
    lowStockCount,
  }
}

export default function AppLayout({ loaderData }: Route.ComponentProps) {
  const location = useLocation()
  const navigation = useNavigation()
  const isNavigating = navigation.state === 'loading'
  const isPageNavigation =
    isNavigating && navigation.location.pathname !== location.pathname

  return (
    <AuthProvider
      value={{
        session: loaderData.session,
        permissions: loaderData.permissions,
        availableOrganizations: loaderData.organizations,
      }}
    >
      <SidebarProvider>
        <AppSidebar lowStockCount={loaderData.lowStockCount} />
        <div className='bg-background flex min-h-screen flex-1 flex-col'>
          <SiteHeader />
          <main
            className='page-container flex-1'
            aria-busy={isPageNavigation}
          >
            {isPageNavigation ? <PageSkeleton /> : <Outlet />}
          </main>
        </div>
      </SidebarProvider>
    </AuthProvider>
  )
}
