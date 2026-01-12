import { Outlet } from "react-router";
import AppSidebar from "~/components/AppSidebar";
import { SidebarProvider, SidebarTrigger } from "~/components/ui/sidebar";
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
        <main className="flex-1">
          <SidebarTrigger />
          <Outlet />
        </main>
      </SidebarProvider>
    </AuthProvider>
  );
}
