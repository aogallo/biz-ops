/**
 * Shared types for invitation feature
 * Used by both server and client to avoid duplication
 */

export interface InvitationRow {
  id: string;
  email: string;
  status: "pending" | "accepted" | "expired";
  createdAt: Date;
  expiresAt: Date;
  roleName: string | null;
  roleId: string | null;
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

export interface InvitationFormData {
  // Step 1: User Information
  email: string;
  name: string;

  // Step 2: Role Assignment
  roleId: string | null;
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
