export const ROLE_MESSAGES = {
  // Success
  created: "Role created successfully.",
  updated: "Role updated successfully.",
  deleted: "Role deleted successfully.",

  // Errors - General
  notFound: "Role not found. It may have been deleted.",
  noOrganization: "Please select an organization to manage roles.",

  // Errors - Validation
  nameExists: "A role with this name already exists in your organization.",
  systemRoleProtected:
    "System roles (owner, admin, member) cannot be modified or deleted.",
  reservedName: "This role name is reserved for system roles.",

  // Errors - Deletion
  hasMembers:
    "Cannot delete role. Some members are still assigned to this role. Please reassign them first.",

  // Info
  systemRoleInfo:
    "System roles are created automatically and cannot be deleted.",
} as const;
