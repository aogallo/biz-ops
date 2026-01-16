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
} from '@react-email/components'

interface OrganizationInviteEmailProps {
  inviterName: string
  organizationName: string
  inviteeEmail: string
  inviteLink: string
  organizationDescription?: string
}

const OrganizationInviteEmail = (props: OrganizationInviteEmailProps) => {
  const { inviterName, organizationName, inviteLink, organizationDescription } =
    props

  return (
    <Html lang='en' dir='ltr'>
      <Tailwind>
        <Head />
        <Preview>You&apos;ve been invited to join {organizationName}</Preview>
        <Body className='bg-gray-100 py-10 font-sans'>
          <Container className='mx-auto max-w-150 rounded-xl bg-white p-10 shadow-sm'>
            <Section>
              <Heading className='mb-6 text-center text-[28px] font-bold text-gray-900'>
                Welcome to {organizationName}!
              </Heading>

              <Text className='mb-5 text-[16px] text-gray-700'>Hi there,</Text>

              <Text className='mb-5 text-[16px] text-gray-700'>
                Great news! {inviterName} has invited you to join{' '}
                <strong>{organizationName}</strong>.
                {organizationDescription && ` ${organizationDescription}`}
              </Text>

              <Text className='mb-8 text-[16px] text-gray-700'>
                You&apos;ll have access to collaborate with the team, manage
                projects, and contribute to our shared goals. Click the button
                below to accept your invitation and get started.
              </Text>

              <Section className='mb-8 text-center'>
                <Button
                  href={inviteLink}
                  className='box-border rounded-[6px] bg-blue-600 px-8 py-3 text-[16px] font-medium text-white'
                >
                  Accept Invitation
                </Button>
              </Section>

              <Text className='mb-5 text-[14px] text-gray-600'>
                If the button doesn&apos;t work, you can copy and paste this
                link into your browser:
              </Text>

              <Text className='mb-8 text-[14px] break-all text-blue-600'>
                {inviteLink}
              </Text>

              <Hr className='my-8 border-gray-200' />

              <Text className='mb-5 text-[16px] text-gray-700'>
                <strong>What happens next?</strong>
              </Text>

              <Text className='mb-2 text-[14px] text-gray-600'>
                • Complete your profile setup
              </Text>
              <Text className='mb-2 text-[14px] text-gray-600'>
                • Explore your team workspace
              </Text>
              <Text className='mb-2 text-[14px] text-gray-600'>
                • Connect with your teammates
              </Text>
              <Text className='mb-6 text-[14px] text-gray-600'>
                • Start collaborating on projects
              </Text>

              <Text className='mb-5 text-[16px] text-gray-700'>
                If you have any questions or need assistance, feel free to reach
                out to {inviterName} or our support team.
              </Text>

              <Text className='mb-8 text-[16px] text-gray-700'>
                We&apos;re excited to have you on board!
              </Text>

              <Text className='text-[16px] text-gray-700'>
                Best regards,
                <br />
                The {organizationName} Team
              </Text>
            </Section>

            <Hr className='my-8 border-gray-200' />

            <Section>
              <Text className='m-0 text-[12px] text-gray-500'>
                123 Business Street, Suite 100
                <br />
                Business City, BC 12345
              </Text>
              <Text className='mt-2 mb-2 text-[12px] text-gray-500'>
                <Link href='#' className='text-gray-500'>
                  Unsubscribe
                </Link>{' '}
                |
                <Link href='#' className='ml-2 text-gray-500'>
                  Privacy Policy
                </Link>
              </Text>
              <Text className='m-0 text-[12px] text-gray-500'>
                © 2026 {organizationName}. All rights reserved.
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  )
}

OrganizationInviteEmail.PreviewProps = {
  inviterName: 'Sarah Johnson',
  organizationName: 'TechCorp Solutions',
  inviteeEmail: 'newmember@example.com',
  inviteLink: 'https://app.techcorp.com/invite/accept?token=abc123xyz',
  organizationDescription:
    "We're a forward-thinking technology company focused on innovative software solutions.",
}

export default OrganizationInviteEmail
