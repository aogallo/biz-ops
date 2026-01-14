export const USER_MESSAGES = {
  // Success messages
  invited: "Invitation sent successfully.",
  invitationCancelled: "Invitation cancelled successfully.",
  removed: "User removed from organization successfully.",

  // Error messages
  notFound: "User not found.",
  alreadyMember: "This user is already a member of this organization.",
  alreadyExists:
    "A user with this email already exists. Please add them to the organization directly.",
  noPermission:
    "You don't have permission to manage users in this organization.",
  noOrganization: "Please select an organization to manage users.",

  // Invitation errors
  invalidInvitation: "Invalid or expired invitation.",
  invitationExpired: "This invitation has expired.",
  invitationAccepted: "Welcome! Your account has been created successfully.",

  // Info messages
  pendingInvitation: "Pending invitation - waiting for user to accept",
} as const;
