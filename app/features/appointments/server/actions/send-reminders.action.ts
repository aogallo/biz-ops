import { and, eq, isNull, sql } from 'drizzle-orm'
import { db } from '~/server/db'
import { appointmentModel } from '~/server/db/schemas/appointment'
import { businessPartnerModel } from '~/server/db/schemas/businessPartner'
import { serviceModel } from '~/server/db/schemas/service'
import {
  memberModel,
  userModel,
  organizationModel,
} from '~/server/db/schemas/auth'
import { sendAppointmentReminderEmail } from '~/server/email/appointment-reminder.server'

interface SendRemindersResult {
  sent: number
  failed: number
  errors: { appointmentId: string; email: string; error: string }[]
}

export async function sendUpcomingReminders(): Promise<SendRemindersResult> {
  // Calculate tomorrow's date
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const tomorrowStr = tomorrow.toISOString().split('T')[0]

  // Query appointments for tomorrow that haven't had reminders sent
  const appointments = await db
    .select({
      appointmentId: appointmentModel.id,
      date: appointmentModel.date,
      startTime: appointmentModel.startTime,
      clientName: businessPartnerModel.name,
      clientEmail: businessPartnerModel.email,
      serviceName: serviceModel.name,
      staffName: userModel.name,
      organizationName: organizationModel.name,
    })
    .from(appointmentModel)
    .innerJoin(
      businessPartnerModel,
      eq(appointmentModel.clientId, businessPartnerModel.id)
    )
    .innerJoin(serviceModel, eq(appointmentModel.serviceId, serviceModel.id))
    .innerJoin(memberModel, eq(appointmentModel.staffId, memberModel.id))
    .innerJoin(userModel, eq(memberModel.userId, userModel.id))
    .innerJoin(
      organizationModel,
      eq(appointmentModel.organizationId, organizationModel.id)
    )
    .where(
      and(
        eq(appointmentModel.date, tomorrowStr),
        sql`${appointmentModel.status} IN ('pending', 'confirmed')`,
        isNull(appointmentModel.reminderSentAt)
      )
    )

  const result: SendRemindersResult = { sent: 0, failed: 0, errors: [] }

  for (const apt of appointments) {
    // Skip if client has no email
    if (!apt.clientEmail) continue

    try {
      await sendAppointmentReminderEmail({
        to: apt.clientEmail,
        clientName: apt.clientName,
        staffName: apt.staffName ?? 'Staff',
        serviceName: apt.serviceName,
        date: apt.date,
        startTime: apt.startTime,
        organizationName: apt.organizationName,
      })

      // Mark reminder as sent
      await db
        .update(appointmentModel)
        .set({ reminderSentAt: new Date() })
        .where(eq(appointmentModel.id, apt.appointmentId))

      result.sent++
    } catch (error) {
      result.failed++
      result.errors.push({
        appointmentId: apt.appointmentId,
        email: apt.clientEmail,
        error: error instanceof Error ? error.message : String(error),
      })
    }
  }

  console.log(
    `📧 Reminder results: ${result.sent} sent, ${result.failed} failed`
  )
  return result
}
