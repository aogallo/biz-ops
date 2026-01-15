import { Outlet } from "react-router";
import AppSidebar from "~/components/AppSidebar";
import SiteHeader from "~/components/SiteHeader";
import { SidebarProvider } from "~/components/ui/sidebar";
import { AuthProvider } from "~/contexts/AuthContext";
import { getUserPermissions } from "~/server/auth/permissions.server";
import { requireAuth } from "~/server/auth/session.server";
import { isSuperAdmin } from "~/server/permissions";
import type { Route } from "./+types/AppLayout";

// Add loader to require authentication and load permissions
export async function loader({ request }: Route.LoaderArgs) {
  const session = await requireAuth(request);
  const userId = session.user.id;
  const organizationId = session.session.activeOrganizationId;

  // Fetch permissions and super admin status in parallel
  const [permissions, isSuperAdminUser] = await Promise.all([
    organizationId
      ? getUserPermissions(userId, organizationId)
      : Promise.resolve([]),
    isSuperAdmin(userId),
  ]);

  // Fetch all organizations for super admin, or just user's organizations
  let organizations: any[] = [];
  if (isSuperAdminUser) {
    // Super admin sees ALL organizations
    const { db } = await import("~/server/db");
    const { organizationModel } = await import("~/server/db/schemas/auth");
    organizations = await db.select().from(organizationModel);
  } else {
    // Regular users see only their member organizations
    const { getUserOrganizations } =
      await import("~/server/auth/organization.server");
    const userOrgs = await getUserOrganizations(userId);
    organizations = userOrgs.map((org) => ({
      id: org.organization.id,
      name: org.organization.name,
      slug: org.organization.slug,
      isAdmin: org.organization.isAdmin,
    }));
  }

  return {
    session,
    permissions: {
      list: permissions,
      isSuperAdmin: isSuperAdminUser,
    },
    organizations,
  };
}

export default function AppLayout({ loaderData }: Route.ComponentProps) {
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
        <div className="flex-1">
          <SiteHeader />
          <main className="self-stretch p-6 gap-1 px-4 mt-1 lg:gap-2 lg:px-6 container mx-auto py-6">
            <Outlet />
          </main>
        </div>
      </SidebarProvider>
    </AuthProvider>
  );
}
