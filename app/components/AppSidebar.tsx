import {
  BarChart3,
  Building2,
  Home,
  Layers,
  LogOut,
  Mail,
  Package,
  ScrollText,
  Settings,
  User,
  Users,
} from "lucide-react";
import { Form, Link } from "react-router";
import { useAuth, useOptionalOrganization } from "~/contexts/AuthContext";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "./ui/sidebar";

export const navigationItems = [
  { name: "Dashboard", path: "/dashboard", icon: Home },
  { name: "Users", path: "/admin/users", icon: Users },
  { name: "Organization", path: "/organization", icon: Building2 },
  { name: "Profile", path: "/profile", icon: User },
  { name: "Analytics", path: "/analytics", icon: BarChart3 },
  { name: "Products", path: "/products", icon: Package },
  { name: "Customers", path: "/customers", icon: Users },
  { name: "Companies", path: "/companies", icon: Building2 },
  { name: "Invoices", path: "/invoices", icon: ScrollText },
  { name: "Invitations", path: "/invitations", icon: Mail },
  { name: "Reports", path: "/reports", icon: Layers },
  { name: "Settings", path: "/settings", icon: Settings },
];

const AppSidebar = () => {
  const { session } = useAuth();
  const organization = useOptionalOrganization();

  return (
    <Sidebar>
      <SidebarHeader>
        <SidebarMenu className="items-center">
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link to="/organization">
                {organization ? (
                  <div className="flex flex-col items-start">
                    <span className="font-semibold">
                      {organization.data.name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {organization.membership.role}
                    </span>
                  </div>
                ) : (
                  <span>ERP System</span>
                )}
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup />
        <SidebarMenu>
          {navigationItems.map((menu) => (
            <SidebarMenuItem key={menu.name}>
              <SidebarMenuButton asChild>
                <Link to={menu.path}>
                  <menu.icon />
                  <span>{menu.name}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>

        <SidebarGroup />
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex flex-col gap-2 px-2 py-3">
              <p className="text-sm font-medium text-foreground">
                {session.user.name || session.user.email}
              </p>
              {session.user.name && (
                <p className="text-xs text-muted-foreground">
                  {session.user.email}
                </p>
              )}
              <Form method="post" action="/logout">
                <button
                  type="submit"
                  className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </button>
              </Form>
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
};

export default AppSidebar;
