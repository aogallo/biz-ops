import {
  accountModel,
  invitationModel,
  invitationRoleModel,
  memberModel,
  memberRoleModel,
  organizationModel,
  permissionModel,
  roleModel,
  rolePermissionModel,
  sessionModel,
  userModel,
  verificationModel,
} from "./auth";

export const schema = {
  user: userModel,
  session: sessionModel,
  account: accountModel,
  verification: verificationModel,
  organization: organizationModel,
  member: memberModel,
  memberRole: memberRoleModel,
  invitation: invitationModel,
  invitationRole: invitationRoleModel,
  role: roleModel,
  permission: permissionModel,
  rolePermission: rolePermissionModel,
};
