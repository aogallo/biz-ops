/**
 * Shared types for invitation feature
 * Used by both server and client to avoid duplication
 */

export interface InvitationRole {
  id: string;
  name: string;
}

export interface InvitationRow {
  id: string;
  email: string;
  status: "pending" | "accepted" | "expired";
  createdAt: Date;
  expiresAt: Date;
  /** @deprecated Use roles[] instead */
  roleName: string | null;
  /** @deprecated Use roles[] instead */
  roleId: string | null;
  /** Multiple roles assigned to the invitation */
  roles: InvitationRole[];
  inviterName: string;
}

export interface RoleData {
  id: string;
  name: string;
  description: string | null;
  isSystem: boolean;
}

export interface PermissionData {
  id: string;
  resource: string;
  action: string;
  description: string | null;
  isSystem: boolean;
}

export interface CustomPermission {
  resource: string;
  action: string;
}

export interface OrganizationData {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  isAdmin: boolean;
}

export interface InvitationFormData {
  // Organization selection
  organizationId: string | null;

  // Step 1: User Information
  email: string;
  name: string;

  // Step 2: Role Assignment
  /** @deprecated Use roleIds[] instead */
  roleId: string | null;
  /** Multiple roles to assign to the invitee */
  roleIds: string[];
  createNewRole: boolean;
  newRoleName: string;
  newRoleDescription: string;

  // Step 3: Permissions
  selectedPermissions: string[]; // permission IDs
  customPermissions: CustomPermission[];
}

export interface WizardState extends InvitationFormData {
  currentStep: 1 | 2 | 3 | 4;
  errors: Record<string, string>;
}
