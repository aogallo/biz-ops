import {
  Banknote,
  Building2,
  BuildingIcon,
  Calendar1,
  CalendarDays,
  ChartColumnBig,
  Drumstick,
  FolderTreeIcon,
  LogOut,
  Mail,
  NewspaperIcon,
  Package,
  PackageCheck,
  Shapes,
  Truck,
  Users,
} from 'lucide-react'
import { Form, Link, NavLink } from 'react-router'
import { useAuth, useOptionalOrganization } from '~/contexts/AuthContext'
import { useFilteredNavigation } from '~/hooks/usePermissions'
import { cn } from '~/lib/utils'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
} from './ui/sidebar'

export const navigationItems = [
  {
    section: 'Admin',
    icon: Drumstick,
    color: 'text-rose-500',
    items: [
      { name: 'Dashboard', path: '/dashboard', icon: ChartColumnBig },
      { name: 'Organization', path: '/organization', icon: Building2 },
      { name: 'Users', path: '/users', icon: Users },
      { name: 'Roles', path: '/roles', icon: Users },
      { name: 'Business Partners', path: '/business-partners', icon: Users },
      { name: 'Companies', path: '/company', icon: BuildingIcon },
      { name: 'Invitations', path: '/invitations', icon: Mail },
    ],
  },
  {
    section: 'Inventory',
    icon: Package,
    color: 'text-amber-500',
    items: [
      { name: 'Products', path: '/products', icon: Shapes },
      { name: 'Stock', path: '/stock', icon: PackageCheck },
      { name: 'Suppliers', path: '/suppliers', icon: Truck },
    ],
  },
  {
    section: 'Accounting',
    icon: Building2,
    color: 'text-green-500',
    items: [
      { name: 'Invoices', path: '/invoices', icon: NewspaperIcon },
      { name: 'Expenses', path: '/expenses', icon: Banknote },
      { name: 'SAT Processor', path: '/sat-processor', icon: FolderTreeIcon },
    ],
  },
  {
    section: 'Appointments',
    icon: CalendarDays,
    color: 'text-blue-500',
    items: [{ name: 'Calendar', path: '/calendar', icon: Calendar1 }],
  },
]

const AppSidebar = () => {
  const { session, permissions, availableOrganizations } = useAuth()
  const organization = useOptionalOrganization()

  // Filter navigation items based on user permissions
  const visibleMenus = useFilteredNavigation(navigationItems)

  const isSuperAdmin = permissions.isSuperAdmin
  const activeOrgId = session.session.activeOrganizationId

  return (
    <Sidebar>
      <SidebarHeader>
        <SidebarMenu className='items-center'>
          <SidebarMenuItem>
            {isSuperAdmin &&
            availableOrganizations &&
            availableOrganizations.length > 0 ? (
              // Super admin organization switcher
              <Form method='post' action='/switch-organization'>
                <select
                  name='organizationId'
                  value={activeOrgId || ''}
                  onChange={(e) => e.currentTarget.form?.requestSubmit()}
                  className='w-full rounded-md border px-3 py-2 text-sm'
                >
                  <option value=''>Select Organization</option>
                  {availableOrganizations.map((org) => (
                    <option key={org.id} value={org.id}>
                      {org.name} {org.isAdmin ? '(Admin)' : ''}
                    </option>
                  ))}
                </select>
              </Form>
            ) : (
              // Regular user organization display
              <SidebarMenuButton asChild>
                <Link to='/organization'>
                  {organization ? (
                    <div className='flex flex-col items-start'>
                      <span className='font-semibold'>
                        {organization.data.name}
                      </span>
                      <span className='text-muted-foreground text-xs'>
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
          {visibleMenus.map((section) => (
            <SidebarMenuItem key={section.section}>
              <SidebarMenuButton asChild>
                {/* <Link to={section.}> */}
                <SidebarMenuItem>
                  <section.icon className={cn(section.color)} />
                  <span>{section.section}</span>
                </SidebarMenuItem>
                {/* </Link> */}
              </SidebarMenuButton>
              <SidebarMenuSub>
                {section.items.map((item) => (
                  <SidebarMenuSubItem key={item.name}>
                    <NavLink
                      className={({ isActive }) =>
                        isActive
                          ? 'bg-blue-800 font-semibold text-blue-500'
                          : ''
                      }
                      to={item.path}
                    >
                      <SidebarMenuButton>
                        <item.icon />
                        <span> {item.name}</span>
                      </SidebarMenuButton>
                    </NavLink>
                  </SidebarMenuSubItem>
                ))}
              </SidebarMenuSub>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>

        <SidebarGroup />
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <div className='flex flex-col gap-2 px-2 py-3'>
              <p className='text-foreground text-sm font-medium'>
                {session.user.name || session.user.email}
              </p>
              {session.user.name && (
                <p className='text-muted-foreground text-xs'>
                  {session.user.email}
                </p>
              )}
              <Form method='post' action='/logout'>
                <button
                  type='submit'
                  className='text-muted-foreground hover:bg-accent hover:text-accent-foreground flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors'
                >
                  <LogOut className='h-4 w-4' />
                  Sign Out
                </button>
              </Form>
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}

export default AppSidebar
