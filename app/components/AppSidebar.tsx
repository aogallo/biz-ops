import { Building2, LogOut, Mail, Package, Users } from "lucide-react";
import { Form, Link } from "react-router";
import { useAuth, useOptionalOrganization } from "~/contexts/AuthContext";
import { useFilteredNavigation } from "~/hooks/usePermissions";
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
  { name: "Users", path: "/users", icon: Users },
  { name: "Roles", path: "/roles", icon: Users },
  { name: "Organization", path: "/organization", icon: Building2 },
  { name: "Business Partners", path: "/business-partners", icon: Users },
  { name: "Products", path: "/products", icon: Package },
  { name: "Invitations", path: "/invitations", icon: Mail },
];

const AppSidebar = () => {
  const { session, permissions, availableOrganizations } = useAuth();
  const organization = useOptionalOrganization();

  // Filter navigation items based on user permissions
  const visibleMenus = useFilteredNavigation(navigationItems);

  const isSuperAdmin = permissions.isSuperAdmin;
  const activeOrgId = session.session.activeOrganizationId;

  return (
    <Sidebar>
      <SidebarHeader>
        <SidebarMenu className="items-center">
          <SidebarMenuItem>
            {isSuperAdmin &&
            availableOrganizations &&
            availableOrganizations.length > 0 ? (
              // Super admin organization switcher
              <Form method="post" action="/switch-organization">
                <select
                  name="organizationId"
                  value={activeOrgId || ""}
                  onChange={(e) => e.currentTarget.form?.requestSubmit()}
                  className="w-full rounded-md border px-3 py-2 text-sm"
                >
                  <option value="">Select Organization</option>
                  {availableOrganizations.map((org) => (
                    <option key={org.id} value={org.id}>
                      {org.name} {org.isAdmin ? "(Admin)" : ""}
                    </option>
                  ))}
                </select>
              </Form>
            ) : (
              // Regular user organization display
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
            )}
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup />
        <SidebarMenu>
          {visibleMenus.map((menu) => (
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
                  className="cursor-pointer flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
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
