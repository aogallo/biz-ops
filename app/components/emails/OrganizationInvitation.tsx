import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Tailwind,
  Text,
} from "@react-email/components";

interface OrganizationInviteEmailProps {
  inviterName: string;
  organizationName: string;
  inviteeEmail: string;
  inviteLink: string;
  organizationDescription?: string;
}

const OrganizationInviteEmail = (props: OrganizationInviteEmailProps) => {
  const {
    inviterName,
    organizationName,
    inviteeEmail,
    inviteLink,
    organizationDescription,
  } = props;

  return (
    <Html lang="en" dir="ltr">
      <Tailwind>
        <Head />
        <Preview>You've been invited to join {organizationName}</Preview>
        <Body className="bg-gray-100 font-sans py-[40px]">
          <Container className="bg-white rounded-[8px] shadow-sm max-w-[600px] mx-auto p-[40px]">
            <Section>
              <Heading className="text-[28px] font-bold text-gray-900 mb-[24px] text-center">
                Welcome to {organizationName}!
              </Heading>

              <Text className="text-[16px] text-gray-700 mb-[20px]">
                Hi there,
              </Text>

              <Text className="text-[16px] text-gray-700 mb-[20px]">
                Great news! {inviterName} has invited you to join{" "}
                <strong>{organizationName}</strong>.
                {organizationDescription && ` ${organizationDescription}`}
              </Text>

              <Text className="text-[16px] text-gray-700 mb-[32px]">
                You'll have access to collaborate with the team, manage
                projects, and contribute to our shared goals. Click the button
                below to accept your invitation and get started.
              </Text>

              <Section className="text-center mb-[32px]">
                <Button
                  href={inviteLink}
                  className="bg-blue-600 text-white px-[32px] py-[12px] rounded-[6px] text-[16px] font-medium box-border"
                >
                  Accept Invitation
                </Button>
              </Section>

              <Text className="text-[14px] text-gray-600 mb-[20px]">
                If the button doesn't work, you can copy and paste this link
                into your browser:
              </Text>

              <Text className="text-[14px] text-blue-600 mb-[32px] break-all">
                {inviteLink}
              </Text>

              <Hr className="border-gray-200 my-[32px]" />

              <Text className="text-[16px] text-gray-700 mb-[20px]">
                <strong>What happens next?</strong>
              </Text>

              <Text className="text-[14px] text-gray-600 mb-[8px]">
                • Complete your profile setup
              </Text>
              <Text className="text-[14px] text-gray-600 mb-[8px]">
                • Explore your team workspace
              </Text>
              <Text className="text-[14px] text-gray-600 mb-[8px]">
                • Connect with your teammates
              </Text>
              <Text className="text-[14px] text-gray-600 mb-[24px]">
                • Start collaborating on projects
              </Text>

              <Text className="text-[16px] text-gray-700 mb-[20px]">
                If you have any questions or need assistance, feel free to reach
                out to {inviterName} or our support team.
              </Text>

              <Text className="text-[16px] text-gray-700 mb-[32px]">
                We're excited to have you on board!
              </Text>

              <Text className="text-[16px] text-gray-700">
                Best regards,
                <br />
                The {organizationName} Team
              </Text>
            </Section>

            <Hr className="border-gray-200 my-[32px]" />

            <Section>
              <Text className="text-[12px] text-gray-500 m-0">
                123 Business Street, Suite 100
                <br />
                Business City, BC 12345
              </Text>
              <Text className="text-[12px] text-gray-500 mt-[8px] mb-[8px]">
                <Link href="#" className="text-gray-500">
                  Unsubscribe
                </Link>{" "}
                |
                <Link href="#" className="text-gray-500 ml-[8px]">
                  Privacy Policy
                </Link>
              </Text>
              <Text className="text-[12px] text-gray-500 m-0">
                © 2026 {organizationName}. All rights reserved.
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

OrganizationInviteEmail.PreviewProps = {
  inviterName: "Sarah Johnson",
  organizationName: "TechCorp Solutions",
  inviteeEmail: "newmember@example.com",
  inviteLink: "https://app.techcorp.com/invite/accept?token=abc123xyz",
  organizationDescription:
    "We're a forward-thinking technology company focused on innovative software solutions.",
};

export default OrganizationInviteEmail;
