import AppointmentReminderEmail from '~/components/emails/AppointmentReminder'

interface AppointmentReminderParams {
  to: string
  clientName: string
  staffName: string
  serviceName: string
  date: string
  startTime: string
  organizationName: string
}

export async function sendAppointmentReminderEmail(params: AppointmentReminderParams) {
  const { to, clientName, staffName, serviceName, date, startTime, organizationName } = params

  // Development mode: Log to console
  if (process.env.NODE_ENV === 'development' || !process.env.RESEND_API_KEY) {
    console.log('\n📧 [DEV MODE] Appointment Reminder Email\n')
    console.log(`To: ${to}`)
    console.log(`Client: ${clientName}`)
    console.log(`Staff: ${staffName}`)
    console.log(`Service: ${serviceName}`)
    console.log(`Date: ${date}`)
    console.log(`Time: ${startTime}`)
    console.log(`Organization: ${organizationName}\n`)
    return
  }

  // Production mode: Send via Resend
  try {
    const { Resend } = await import('resend')
    const resend = new Resend(process.env.RESEND_API_KEY)

    const formattedDate = new Date(date + 'T00:00:00').toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })

    await resend.emails.send({
      from: process.env.EMAIL_FROM!,
      to,
      subject: `Reminder: Your appointment tomorrow at ${startTime} - ${organizationName}`,
      react: AppointmentReminderEmail({
        clientName,
        staffName,
        serviceName,
        date: formattedDate,
        startTime,
        organizationName,
      }),
    })

    console.log(`✅ Appointment reminder sent to ${to}`)
  } catch (error) {
    console.error(`❌ Failed to send appointment reminder to ${to}:`, error)
    throw new Error(`Failed to send appointment reminder to ${to}`)
  }
}
