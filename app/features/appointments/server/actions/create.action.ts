import { requireAuth } from '~/server/auth/session.server'
import { servicesRepository } from '~/features/services/server/repository'
import { createAppointmentSchema } from '../../schemas'
import { appointmentsRepository } from '../repository'
import { getLocaleFromRequest, translateServer } from '~/i18n/translate.server'

/**
 * Calculate end time based on start time and duration
 */
function calculateEndTime(startTime: string, durationMinutes: number): string {
  const [hours, minutes] = startTime.split(':').map(Number)
  const totalMinutes = hours * 60 + minutes + durationMinutes
  const endHours = Math.floor(totalMinutes / 60) % 24
  const endMinutes = totalMinutes % 60
  return `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`
}

export async function createAppointmentAction(request: Request) {
  const session = await requireAuth(request)
  const locale = getLocaleFromRequest(request)

  const organizationId = session.session.activeOrganizationId
  if (!organizationId) {
    return {
      success: false,
      message: translateServer(locale, 'appointments.noOrganization'),
    }
  }

  const formData = await request.formData()

  const inputValues = {
    clientId: formData.get('clientId') || undefined,
    serviceId: formData.get('serviceId') || undefined,
    staffId: formData.get('staffId') || undefined,
    date: formData.get('date') || undefined,
    startTime: formData.get('time') || undefined, // Note: form uses 'time' field
    notes: formData.get('notes') || undefined,
    status: 'pending' as const,
    organizationId,
  }

  // Validate input
  const result = createAppointmentSchema.safeParse(inputValues)
  if (!result.success) {
    const fieldErrors = result.error.flatten().fieldErrors
    return {
      success: false,
      message: translateServer(locale, 'appointments.created.fill'),
      errors: {
        clientId: fieldErrors.clientId?.[0],
        serviceId: fieldErrors.serviceId?.[0],
        staffId: fieldErrors.staffId?.[0],
        date: fieldErrors.date?.[0],
        startTime: fieldErrors.startTime?.[0],
        notes: fieldErrors.notes?.[0],
      },
    }
  }

  // Get service to calculate end time
  const service = await servicesRepository.getByIdAndOrganization(
    result.data.serviceId,
    organizationId
  )

  if (!service) {
    return {
      success: false,
      message: translateServer(locale, 'appointments.noService'),
      errors: { serviceId: translateServer(locale, 'appointments.noService') },
    }
  }

  // Calculate end time from start time + service duration
  const endTime = calculateEndTime(result.data.startTime, service.duration)

  try {
    const appointment = await appointmentsRepository.create({
      organizationId,
      clientId: result.data.clientId,
      serviceId: result.data.serviceId,
      staffId: result.data.staffId,
      date: result.data.date,
      startTime: result.data.startTime,
      endTime,
      status: result.data.status || 'pending',
      notes: result.data.notes,
    })

    return {
      success: true,
      data: appointment,
    }
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : translateServer(locale, 'appointments.failed'),
    }
  }
}
