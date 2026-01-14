/**
 * Email service for sending invitation emails
 * Uses Resend API in production, console logs in development
 */

import OrganizationInviteEmail from "~/components/emails/OrganizationInvitation";

interface InvitationEmailParams {
  to: string;
  inviterName: string;
  organizationName: string;
  invitationToken: string;
  roleName?: string;
}

/**
 * Send invitation email to a new user
 * @param params - Email parameters
 */
export async function sendInvitationEmail(params: InvitationEmailParams) {
  const { to, inviterName, organizationName, invitationToken, roleName } =
    params;

  // Build invitation URL
  const baseUrl = process.env.BETTER_AUTH_URL || "http://localhost:5173";
  const invitationUrl = `${baseUrl}/invitation/accept/${invitationToken}`;

  // Development mode: Log to console
  // if (process.env.NODE_ENV === "development" || !process.env.RESEND_API_KEY) {
  //   console.log("\n📧 [DEV MODE] Invitation Email\n");
  //   console.log(`To: ${to}`);
  //   console.log(`From: ${inviterName} at ${organizationName}`);
  //   console.log(`Role: ${roleName || "Member"}`);
  //   console.log(`\nInvitation URL:\n${invitationUrl}\n`);
  //   console.log("Copy the URL above to accept the invitation\n");
  //   return;
  // }

  // Production mode: Send via Resend
  try {
    // Dynamically import Resend only in production
    const { Resend } = await import("resend");
    const resend = new Resend(process.env.RESEND_API_KEY);

    await resend.emails.send({
      from: process.env.EMAIL_FROM || "noreply@yourdomain.com",
      to,
      subject: `You've been invited to join ${organizationName}`,
      react: OrganizationInviteEmail({
        inviterName,
        organizationName,
        inviteeEmail: to,
        inviteLink: invitationUrl,
      }),
    });

    console.log(`✅ Invitation email sent to ${to}`);
  } catch (error) {
    console.error("❌ Failed to send invitation email:", error);
    // Fallback: Log the URL so it's not lost
    console.log(`\nInvitation URL (email failed): ${invitationUrl}\n`);
    throw new Error("Failed to send invitation email");
  }
}

/**
 * Send invitation reminder email
 * For pending invitations that haven't been accepted
 */
export async function sendInvitationReminder(params: InvitationEmailParams) {
  const { to, organizationName, invitationToken } = params;

  const baseUrl = process.env.BETTER_AUTH_URL || "http://localhost:5173";
  const invitationUrl = `${baseUrl}/invitation/accept/${invitationToken}`;

  // if (process.env.NODE_ENV === "development" || !process.env.RESEND_API_KEY) {
  //   console.log("\n📧 [DEV MODE] Invitation Reminder\n");
  //   console.log(`To: ${to}`);
  //   console.log(`Invitation URL: ${invitationUrl}\n`);
  //   return;
  // }

  try {
    const { Resend } = await import("resend");
    const resend = new Resend(process.env.RESEND_API_KEY);

    await resend.emails.send({
      from: process.env.EMAIL_FROM || "noreply@yourdomain.com",
      to,
      subject: `Reminder: Join ${organizationName}`,
      html: `
        <p>This is a reminder that you have a pending invitation to join <strong>${organizationName}</strong>.</p>
        <p><a href="${invitationUrl}">Accept your invitation</a></p>
        <p>This invitation will expire soon.</p>
      `,
    });

    console.log(`✅ Reminder email sent to ${to}`);
  } catch (error) {
    console.error("❌ Failed to send reminder email:", error);
  }
}
