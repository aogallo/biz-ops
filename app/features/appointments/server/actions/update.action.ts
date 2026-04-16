import { requireAuth } from '~/server/auth/session.server'
import { servicesRepository } from '~/features/services/server/repository'
import { updateAppointmentSchema } from '../../schemas'
import { appointmentsRepository } from '../repository'
import { getLocaleFromRequest, translateServer } from '~/i18n/translate.server'

function calculateEndTime(startTime: string, durationMinutes: number): string {
  const [hours, minutes] = startTime.split(':').map(Number)
  const totalMinutes = hours * 60 + minutes + durationMinutes
  const endHours = Math.floor(totalMinutes / 60) % 24
  const endMinutes = totalMinutes % 60
  return `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`
}

export async function updateAppointmentAction(request: Request) {
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
    id: formData.get('appointmentId') as string,
    clientId: (formData.get('clientId') as string) || undefined,
    serviceId: (formData.get('serviceId') as string) || undefined,
    staffId: (formData.get('staffId') as string) || undefined,
    date: (formData.get('date') as string) || undefined,
    startTime: (formData.get('time') as string) || undefined,
    notes: (formData.get('notes') as string) || undefined,
    status: (formData.get('status') as string) || undefined,
  }

  const result = updateAppointmentSchema.safeParse(inputValues)
  if (!result.success) {
    const fieldErrors = result.error.flatten().fieldErrors
    return {
      success: false,
      message: translateServer(locale, 'appointments.updateFailed'),
      errors: {
        clientId: fieldErrors.clientId?.[0],
        serviceId: fieldErrors.serviceId?.[0],
        staffId: fieldErrors.staffId?.[0],
        date: fieldErrors.date?.[0],
        startTime: fieldErrors.startTime?.[0],
        notes: fieldErrors.notes?.[0],
        status: fieldErrors.status?.[0],
      },
    }
  }

  const existing = await appointmentsRepository.getByIdAndOrganization(
    result.data.id,
    organizationId
  )

  if (!existing) {
    return {
      success: false,
      message: translateServer(locale, 'common.notFound'),
    }
  }

  const updateData: Parameters<typeof appointmentsRepository.update>[1] = {
    clientId: result.data.clientId,
    staffId: result.data.staffId,
    date: result.data.date,
    startTime: result.data.startTime,
    notes: result.data.notes,
    status: result.data.status as
      | 'pending'
      | 'confirmed'
      | 'cancelled'
      | 'completed',
  }

  if (result.data.serviceId && result.data.startTime) {
    const service = await servicesRepository.getByIdAndOrganization(
      result.data.serviceId,
      organizationId
    )
    if (service) {
      updateData.serviceId = result.data.serviceId
      updateData.endTime = calculateEndTime(
        result.data.startTime,
        service.duration
      )
    }
  }

  try {
    const updated = await appointmentsRepository.update(
      result.data.id,
      updateData
    )

    return {
      success: true,
      data: updated,
    }
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : translateServer(locale, 'appointments.updateFailed'),
    }
  }
}
