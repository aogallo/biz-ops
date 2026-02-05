import {
  Banknote,
  BookOpen,
  BookOpenIcon,
  Briefcase,
  Building2,
  BuildingIcon,
  Calendar1,
  CalendarDays,
  ChartColumnBig,
  Drumstick,
  FolderTreeIcon,
  HandshakeIcon,
  Mail,
  NewspaperIcon,
  Notebook,
  NotebookPenIcon,
  Package,
  PackageCheck,
  Settings,
  Shapes,
  ShieldXIcon,
  Truck,
  Users,
  UserStarIcon,
} from 'lucide-react'
import { Link, NavLink, useFetcher } from 'react-router'
import { useAuth } from '~/contexts/AuthContext'
import { useFilteredNavigation } from '~/hooks/usePermissions'
import { cn } from '~/lib/utils'
import {
  Sidebar,
  SidebarContent,
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
      { name: 'Accounts', path: '/accounts', icon: BookOpenIcon },
      { name: 'Organization', path: '/organization', icon: Building2 },
      { name: 'Users', path: '/users', icon: Users },
      { name: 'Permissions', path: '/permissions', icon: ShieldXIcon },
      { name: 'Roles', path: '/roles', icon: HandshakeIcon },
      {
        name: 'Business Partners',
        path: '/business-partners',
        icon: UserStarIcon,
      },
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
      { name: 'Journal Entries', path: '/journal-entries', icon: BookOpen },
      { name: 'SAT Processor', path: '/sat-processor', icon: FolderTreeIcon },
      { name: 'Invoices', path: '/invoices', icon: NewspaperIcon },
      { name: 'Expenses', path: '/sat-processor', icon: Banknote },
    ],
  },
  {
    section: 'Settings',
    icon: Settings,
    color: 'text-gray-500',
    items: [
      { name: 'Accounting', path: '/settings/accounting', icon: Settings },
    ],
  },
  {
    section: 'Appointments',
    icon: CalendarDays,
    color: 'text-blue-500',
    items: [
      { name: 'Calendar', path: '/appointments', icon: Calendar1 },
      { name: 'Services', path: '/services', icon: Briefcase },
    ],
  },
  {
    section: 'Reports',
    icon: NotebookPenIcon,
    color: 'text-amber-500',
    items: [
      {
        name: 'Financial Report',
        path: '/reports',
        icon: Notebook,
      },
    ],
  },
]

const AppSidebar = () => {
  const { session, permissions, availableOrganizations } = useAuth()
  const fetcher = useFetcher()

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
              <fetcher.Form method='post' action='/action/switch-organization'>
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
              </fetcher.Form>
            ) : (
              // Regular user organization display
              <SidebarMenuButton asChild>
                <Link to='/organization'>
                  {availableOrganizations && (
                    <div className='flex flex-col items-start'>
                      <span className='font-semibold'>
                        {availableOrganizations[0].name}
                      </span>
                    </div>
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
                <div className='group/menu-item relative'>
                  <section.icon className={cn(section.color)} />
                  <span>{section.section}</span>
                </div>
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
    </Sidebar>
  )
}

export default AppSidebar
