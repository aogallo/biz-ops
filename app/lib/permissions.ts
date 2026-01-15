/**
 * Permission constants for RBAC
 * Maps UI elements (menus, actions) to required permissions
 */

/**
 * Menu path to required permission mapping
 * Each menu item requires at least one of the specified permissions to be visible
 */
export const MENU_PERMISSIONS = {
  "/users": ["user:read"],
  "/roles": ["role:read"],
  "/organization": ["organization:read"],
  "/business-partners": ["business-partner:read"],
  "/products": ["product:read"],
  "/invitations": ["invitation:read"],
} as const;

/**
 * Action key to required permission mapping
 * Each action requires at least one of the specified permissions to be performed
 */
export const ACTION_PERMISSIONS = {
  "users.invite": ["user:create"],
  "roles.create": ["role:create"],
  "roles.edit": ["role:update"],
  "roles.delete": ["role:delete"],
  "products.create": ["product:create"],
  "products.edit": ["product:update"],
  "products.delete": ["product:delete"],
  "business-partners.create": ["business-partner:create"],
  "business-partners.edit": ["business-partner:update"],
  "business-partners.delete": ["business-partner:delete"],
  "invitations.create": ["invitation:create"],
} as const;

export type MenuPath = keyof typeof MENU_PERMISSIONS;
export type ActionKey = keyof typeof ACTION_PERMISSIONS;
