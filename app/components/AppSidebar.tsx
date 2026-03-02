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
  Monitor,
  NewspaperIcon,
  Notebook,
  NotebookPenIcon,
  Package,
  PackageCheck,
  PlusCircle,
  ScanLine,
  Settings,
  Shapes,
  ShieldXIcon,
  ShoppingCart,
  Tag,
  FileText,
  Ticket,
  TicketsPlane,
  Truck,
  Users,
  UserStarIcon,
} from 'lucide-react'
import { Link, NavLink, useFetcher } from 'react-router'
import { useAuth } from '~/contexts/AuthContext'
import { useFilteredNavigation } from '~/hooks/usePermissions'
import { useTranslation } from '~/i18n/context'
import type { TranslationKey } from '~/i18n/types'
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

// Domain-specific accent colors per system.md
export const navigationItems = [
  {
    section: 'Admin',
    sectionKey: 'sidebar.sections.admin' as TranslationKey,
    icon: Drumstick,
    color: 'accent-admin', // indigo/brand for system pages
    items: [
      {
        name: 'Dashboard',
        nameKey: 'sidebar.items.dashboard' as TranslationKey,
        path: '/dashboard',
        icon: ChartColumnBig,
      },
      {
        name: 'Accounts',
        nameKey: 'sidebar.items.accounts' as TranslationKey,
        path: '/accounts',
        icon: BookOpenIcon,
      },
      {
        name: 'Organization',
        nameKey: 'sidebar.items.organization' as TranslationKey,
        path: '/organization',
        icon: Building2,
      },
      {
        name: 'Users',
        nameKey: 'sidebar.items.users' as TranslationKey,
        path: '/users',
        icon: Users,
      },
      {
        name: 'Permissions',
        nameKey: 'sidebar.items.permissions' as TranslationKey,
        path: '/permissions',
        icon: ShieldXIcon,
      },
      {
        name: 'Roles',
        nameKey: 'sidebar.items.roles' as TranslationKey,
        path: '/roles',
        icon: HandshakeIcon,
      },
      {
        name: 'Business Partners',
        nameKey: 'sidebar.items.businessPartners' as TranslationKey,
        path: '/business-partners',
        icon: UserStarIcon,
      },
      {
        name: 'Companies',
        nameKey: 'sidebar.items.companies' as TranslationKey,
        path: '/company',
        icon: BuildingIcon,
      },
      {
        name: 'Invitations',
        nameKey: 'sidebar.items.invitations' as TranslationKey,
        path: '/invitations',
        icon: Mail,
      },
    ],
  },
  {
    section: 'Inventory',
    sectionKey: 'sidebar.sections.inventory' as TranslationKey,
    icon: Package,
    color: 'accent-inventory', // amber for inventory domain
    items: [
      {
        name: 'Products',
        nameKey: 'sidebar.items.products' as TranslationKey,
        path: '/products',
        icon: Shapes,
      },
      {
        name: 'Categories',
        nameKey: 'sidebar.items.categories' as TranslationKey,
        path: '/categories',
        icon: Tag,
      },
      {
        name: 'Stock',
        nameKey: 'sidebar.items.stock' as TranslationKey,
        path: '/stock',
        icon: PackageCheck,
      },
      {
        name: 'Scan QR',
        nameKey: 'sidebar.items.scanQr' as TranslationKey,
        path: '/products/scan',
        icon: ScanLine,
      },
      {
        name: 'Suppliers',
        nameKey: 'sidebar.items.suppliers' as TranslationKey,
        path: '/suppliers',
        icon: Truck,
      },
    ],
  },
  {
    section: 'Purchase',
    sectionKey: 'sidebar.sections.purchase' as TranslationKey,
    icon: TicketsPlane,
    color: '',
    items: [
      {
        name: 'Orders',
        nameKey: 'sidebar.items.orders' as TranslationKey,
        path: '/purchase/orders',
        icon: Ticket,
      },
      {
        name: 'Quotations',
        nameKey: 'sidebar.items.quotations' as TranslationKey,
        path: '/purchase/quotations',
        icon: FileText,
      },
    ],
  },
  {
    section: 'Accounting',
    sectionKey: 'sidebar.sections.accounting' as TranslationKey,
    icon: Building2,
    color: 'accent-accounting', // emerald for accounting domain
    items: [
      {
        name: 'Journal Entries',
        nameKey: 'sidebar.items.journalEntries' as TranslationKey,
        path: '/journal-entries',
        icon: BookOpen,
      },
      {
        name: 'New Entry',
        nameKey: 'sidebar.items.newEntry' as TranslationKey,
        path: '/journal-entries/new',
        icon: PlusCircle,
      },
      {
        name: 'SAT Processor',
        nameKey: 'sidebar.items.satProcessor' as TranslationKey,
        path: '/sat-processor',
        icon: FolderTreeIcon,
      },
      {
        name: 'Invoices',
        nameKey: 'sidebar.items.invoices' as TranslationKey,
        path: '/invoices',
        icon: NewspaperIcon,
      },
      {
        name: 'Expenses',
        nameKey: 'sidebar.items.expenses' as TranslationKey,
        path: '/sat-processor',
        icon: Banknote,
      },
      {
        name: 'Accounting',
        nameKey: 'sidebar.items.accountingSettings' as TranslationKey,
        path: '/settings/accounting',
        icon: Settings,
      },
    ],
  },
  {
    section: 'POS',
    sectionKey: 'sidebar.sections.pos' as TranslationKey,
    icon: ShoppingCart,
    color: 'accent-pos',
    items: [
      {
        name: 'Open POS',
        nameKey: 'sidebar.items.openPos' as TranslationKey,
        path: '/pos',
        icon: Monitor,
      },
      {
        name: 'Terminals',
        nameKey: 'sidebar.items.posTerminals' as TranslationKey,
        path: '/pos-settings/terminals',
        icon: Settings,
      },
      {
        name: 'Cashiers',
        nameKey: 'sidebar.items.posCashiers' as TranslationKey,
        path: '/pos-settings/cashiers',
        icon: Users,
      },
    ],
  },
  {
    section: 'Appointments',
    sectionKey: 'sidebar.sections.appointments' as TranslationKey,
    icon: CalendarDays,
    color: 'accent-appointments', // blue for appointments domain
    items: [
      {
        name: 'Calendar',
        nameKey: 'sidebar.items.calendar' as TranslationKey,
        path: '/appointments',
        icon: Calendar1,
      },
      {
        name: 'Services',
        nameKey: 'sidebar.items.services' as TranslationKey,
        path: '/services',
        icon: Briefcase,
      },
    ],
  },
  {
    section: 'Reports',
    sectionKey: 'sidebar.sections.reports' as TranslationKey,
    icon: NotebookPenIcon,
    color: 'accent-accounting', // emerald for financial reports
    items: [
      {
        name: 'Financial Report',
        nameKey: 'sidebar.items.financialReport' as TranslationKey,
        path: '/reports',
        icon: Notebook,
      },
      {
        name: 'Inventory Report',
        nameKey: 'sidebar.items.inventoryReport' as TranslationKey,
        path: '/reports/inventory',
        icon: Package,
      },
    ],
  },
]

interface AppSidebarProps {
  lowStockCount?: number
}

const AppSidebar = ({ lowStockCount = 0 }: AppSidebarProps) => {
  const { session, permissions, availableOrganizations } = useAuth()
  const fetcher = useFetcher()
  const { t } = useTranslation()

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
                  className='border-border/50 bg-sidebar focus:ring-ring w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:outline-none'
                >
                  <option value=''>{t('sidebar.selectOrganization')}</option>
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
                  <span>{t(section.sectionKey)}</span>
                  {section.section === 'Inventory' && lowStockCount > 0 && (
                    <span className='ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white'>
                      {lowStockCount}
                    </span>
                  )}
                </div>
              </SidebarMenuButton>
              <SidebarMenuSub>
                {section.items.map((item) => (
                  <SidebarMenuSubItem key={item.name}>
                    <NavLink
                      className={({ isActive }) =>
                        cn(
                          'rounded-md transition-colors',
                          isActive
                            ? 'bg-primary/10 text-primary font-medium'
                            : 'hover:bg-primary/5'
                        )
                      }
                      to={item.path}
                    >
                      <SidebarMenuButton>
                        <item.icon className='size-4' />
                        <span>{t(item.nameKey)}</span>
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
