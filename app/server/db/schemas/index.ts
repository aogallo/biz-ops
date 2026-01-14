import {
  accountModel,
  invitationModel,
  memberModel,
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
  invitation: invitationModel,
  role: roleModel,
  permission: permissionModel,
  rolePermission: rolePermissionModel,
};
