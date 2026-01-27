export const PERMISSION_MESSAGES = {
  // Success
  created: 'Permission created successfully.',
  updated: 'Permission updated successfully.',
  deleted: 'Permission deleted successfully.',

  // Errors - General
  notFound: 'Permission not found.',
  notSuperAdmin: 'Only super admins can manage permissions.',

  // Errors - Validation
  duplicateResourceAction:
    'A permission with this resource and action already exists.',
  systemPermissionProtected:
    'System permissions cannot be modified or deleted.',

  // Errors - Deletion
  hasRoles: 'Cannot delete. Remove permission from roles first.',

  // Info
  systemPermissionInfo:
    'System permissions are created automatically and cannot be deleted.',
} as const
