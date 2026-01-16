import { useAuth } from '~/contexts/AuthContext'
import {
  ACTION_PERMISSIONS,
  MENU_PERMISSIONS,
  type ActionKey,
  type MenuPath,
} from '~/lib/permissions'

/**
 * Check if user has a specific permission
 * Super admins always return true
 */
export function useHasPermission(permission: string): boolean {
  const { permissions } = useAuth()

  // Super admin bypass
  if (permissions.isSuperAdmin) return true

  return permissions.list.includes(permission)
}

/**
 * Check if user has ANY of the specified permissions (OR logic)
 * Super admins always return true
 */
export function useHasAnyPermission(requiredPermissions: string[]): boolean {
  const { permissions } = useAuth()

  // Super admin bypass
  if (permissions.isSuperAdmin) return true

  return requiredPermissions.some((perm) => permissions.list.includes(perm))
}

/**
 * Check if user has ALL of the specified permissions (AND logic)
 * Super admins always return true
 */
export function useHasAllPermissions(requiredPermissions: string[]): boolean {
  const { permissions } = useAuth()

  // Super admin bypass
  if (permissions.isSuperAdmin) return true

  return requiredPermissions.every((perm) => permissions.list.includes(perm))
}

/**
 * Check if user can see a specific menu item
 * @param menuPath - Path to menu item (e.g., "/users", "/products")
 * @returns true if user has required permission, false otherwise
 */
export function useCanViewMenu(menuPath: MenuPath): boolean {
  const requiredPermissions = MENU_PERMISSIONS[menuPath]
  return useHasAnyPermission([...requiredPermissions])
}

/**
 * Check if user can perform a specific action (for button visibility)
 * @param action - Action key (e.g., "users.invite", "products.create")
 * @returns true if user has required permission, false otherwise
 */
export function useCanPerformAction(action: ActionKey): boolean {
  const requiredPermissions = ACTION_PERMISSIONS[action]
  return useHasAnyPermission([...requiredPermissions])
}

/**
 * Get filtered navigation items based on user permissions
 * Super admins see all menus, regular users see only menus they have access to
 * @param allMenus - All available navigation items
 * @returns Filtered array of navigation items user can access
 */
export function useFilteredNavigation(
  allMenus: Array<{
    section: string
    icon: any
    color: string
    items: Array<{ path: string; name: string; icon: any }>
  }>
) {
  const { permissions } = useAuth()

  // Super admin sees everything
  if (permissions.isSuperAdmin) {
    return allMenus
  }

  // Filter menus by permission
  const filtered = allMenus.filter((section) => {
    const filteredItems = section.items.filter((item) => {
      const requiredPermissions = MENU_PERMISSIONS[item.path as MenuPath] || []
      const hasPermission = requiredPermissions.some((perm) =>
        permissions.list.includes(perm)
      )
      console.log(
        `Menu: ${item.name}, Path: ${item.path}, Has Permission: ${hasPermission}`
      )
      return hasPermission
    })

    // Keep section only if it has visible items
    if (filteredItems.length > 0) {
      section.items = filteredItems
      return true
    }
    return false
  })

  console.log('Total visible menus:', filtered.length)
  return filtered
}
