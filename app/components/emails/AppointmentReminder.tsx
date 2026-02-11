import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Tailwind,
  Text,
} from '@react-email/components'

interface AppointmentReminderProps {
  clientName: string
  staffName: string
  serviceName: string
  date: string
  startTime: string
  organizationName: string
}

const AppointmentReminderEmail = (props: AppointmentReminderProps) => {
  const { clientName, staffName, serviceName, date, startTime, organizationName } = props

  return (
    <Html lang='en' dir='ltr'>
      <Tailwind>
        <Head />
        <Preview>Reminder: Your appointment tomorrow at {startTime}</Preview>
        <Body className='bg-gray-100 py-10 font-sans'>
          <Container className='mx-auto max-w-150 rounded-xl bg-white p-10 shadow-sm'>
            <Section>
              <Heading className='mb-6 text-center text-[28px] font-bold text-gray-900'>
                Appointment Reminder
              </Heading>

              <Text className='mb-5 text-[16px] text-gray-700'>
                Hi {clientName},
              </Text>

              <Text className='mb-5 text-[16px] text-gray-700'>
                This is a friendly reminder about your upcoming appointment tomorrow.
              </Text>

              <Section className='mb-8 rounded-lg bg-blue-50 p-6'>
                <Text className='mb-2 text-[14px] font-medium text-gray-800'>
                  Appointment Details:
                </Text>
                <Text className='mb-1 text-[14px] text-gray-700'>
                  Date: <strong>{date}</strong>
                </Text>
                <Text className='mb-1 text-[14px] text-gray-700'>
                  Time: <strong>{startTime}</strong>
                </Text>
                <Text className='mb-1 text-[14px] text-gray-700'>
                  Service: <strong>{serviceName}</strong>
                </Text>
                <Text className='mb-0 text-[14px] text-gray-700'>
                  With: <strong>{staffName}</strong>
                </Text>
              </Section>

              <Text className='mb-5 text-[16px] text-gray-700'>
                If you need to reschedule or cancel, please contact us as soon as possible.
              </Text>

              <Text className='mb-8 text-[16px] text-gray-700'>
                We look forward to seeing you!
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
                © 2026 {organizationName}. All rights reserved.
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  )
}

AppointmentReminderEmail.PreviewProps = {
  clientName: 'John Doe',
  staffName: 'Dr. Smith',
  serviceName: 'Business Consultation',
  date: 'February 11, 2026',
  startTime: '10:00 AM',
  organizationName: 'TechCorp Solutions',
}

export default AppointmentReminderEmail
