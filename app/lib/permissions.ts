/**
 * Permission constants for RBAC
 * Maps UI elements (menus, actions) to required permissions
 */

/**
 * Menu path to required permission mapping
 * Each menu item requires at least one of the specified permissions to be visible
 */
export const MENU_PERMISSIONS = {
  // Administrations
  '/dashboard': ['dashboard:read'],
  // Organization
  '/organization': ['organization:read'],
  // Users
  '/users': ['user:read'],
  // Permissions
  '/permissions': ['permission:read'],
  // Roles
  '/roles': ['role:read'],
  // Accounts
  '/accounts': ['account:read'],
  // Journal Entries
  '/journal-entries': ['journal-entry:read'],
  // Business Partner
  '/business-partners': ['business-partner:read'],
  // Company
  '/company': ['company:read'],
  // Invitations
  '/invitations': ['invitation:read'],
  // Inventory
  '/products': ['product:read'],
  '/stock': ['stock:read'],
  '/suppliers': ['suppliers:read'],
  // Accounting
  '/invocies': ['invoice:read'],
  '/sat-processor': ['sat-processor:read'],
  // Appointments
  '/appointments': ['appointments:read'],
  // Services
  '/services': ['service:read'],
  // Settings
  '/settings/accounting': ['settings:accounting'],
  // Reprots
  '/reports': ['reports:create'],
} as const

/**
 * Action key to required permission mapping
 * Each action requires at least one of the specified permissions to be performed
 */
export const ACTION_PERMISSIONS = {
  'users.invite': ['user:create'],
  'roles.create': ['role:create'],
  'roles.edit': ['role:update'],
  'roles.delete': ['role:delete'],
  'products.create': ['product:create'],
  'products.edit': ['product:update'],
  'products.delete': ['product:delete'],
  'business-partners.create': ['business-partner:create'],
  'business-partners.edit': ['business-partner:update'],
  'business-partners.delete': ['business-partner:delete'],
  'invitations.create': ['invitation:create'],
  'company.create': ['company:create'],
  'company.edit': ['company:update'],
  'company.delete': ['company:delete'],
  'settings.accounting': ['settings:accounting'],
  'services.create': ['service:create'],
  'services.edit': ['service:update'],
  'services.delete': ['service:delete'],
} as const

export type MenuPath = keyof typeof MENU_PERMISSIONS
export type ActionKey = keyof typeof ACTION_PERMISSIONS
