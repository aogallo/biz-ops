import { Link, NavLink, useFetcher } from 'react-router'
import { useAuth } from '~/contexts/AuthContext'
import { useFilteredNavigation } from '~/hooks/usePermissions'
import { useTranslation } from '~/i18n/context'
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
import { navigationItems } from './navigationItems'

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
