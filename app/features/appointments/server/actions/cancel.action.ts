import { requireAuth } from '~/server/auth/session.server'
import { appointmentsRepository } from '../repository'
import { getLocaleFromRequest, translateServer } from '~/i18n/translate.server'

export async function cancelAppointmentAction(request: Request) {
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
  const appointmentId = formData.get('appointmentId') as string

  if (!appointmentId) {
    return {
      success: false,
      message: 'Appointment ID is required',
    }
  }

  const appointment = await appointmentsRepository.getByIdAndOrganization(
    appointmentId,
    organizationId
  )

  if (!appointment) {
    return {
      success: false,
      message: translateServer(locale, 'common.notFound'),
    }
  }

  if (appointment.status === 'completed') {
    return {
      success: false,
      message: translateServer(locale, 'appointments.cannotCancelCompleted'),
    }
  }

  if (appointment.status === 'cancelled') {
    return {
      success: false,
      message: translateServer(locale, 'appointments.alreadyCancelled'),
    }
  }

  try {
    const updated = await appointmentsRepository.updateStatus(
      appointmentId,
      'cancelled'
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
          : translateServer(locale, 'appointments.cancelFailed'),
    }
  }
}
