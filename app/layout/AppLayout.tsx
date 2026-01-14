import { Outlet } from "react-router";
import AppSidebar from "~/components/AppSidebar";
import SiteHeader from "~/components/SiteHeader";
import { SidebarProvider } from "~/components/ui/sidebar";
import { AuthProvider } from "~/contexts/AuthContext";
import { requireAuth } from "~/server/auth/session.server";
import type { Route } from "./+types/AppLayout";

// Add loader to require authentication
export async function loader({ request }: Route.LoaderArgs) {
  const session = await requireAuth(request);
  return { session };
}

export default function AppLayout({ loaderData }: Route.ComponentProps) {
  return (
    <AuthProvider value={{ session: loaderData.session }}>
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
