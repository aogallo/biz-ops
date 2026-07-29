import { and, eq, inArray } from 'drizzle-orm'
import { useEffect, useState } from 'react'
import { useFetcher, useNavigate, useSearchParams } from 'react-router'
import { toast } from 'sonner'
import { useTranslation } from '~/i18n/context'
import {
  AppointmentDetailsDrawer,
  CalendarDayView,
  CalendarHeader,
  CalendarMonthView,
  CalendarWeekView,
} from '~/features/appointments/components'
import { cancelAppointmentAction } from '~/features/appointments/server/actions/cancel.action'
import { appointmentsRepository } from '~/features/appointments/server/repository'
import type {
  CalendarView,
  Client,
  Staff,
  Appointment,
} from '~/features/appointments/types'
import { requireAuth } from '~/server/auth/session.server'
import { db } from '~/server/db'
import {
  businessPartnerModel,
  memberModel,
  userModel,
} from '~/server/db/schemas'
import type { Route } from './+types/index'

export async function loader({ request }: Route.LoaderArgs) {
  const session = await requireAuth(request)
  const organizationId = session.session.activeOrganizationId

  if (!organizationId) {
    return {
      staff: [],
      clients: [],
      appointments: [] as Appointment[],
    }
  }

  // Fetch real data from DB in parallel
  const [membersWithUsers, businessPartners, appointmentsData] =
    await Promise.all([
      // Get members with user info (staff)
      db
        .select({
          memberId: memberModel.id,
          userId: userModel.id,
          name: userModel.name,
          email: userModel.email,
          image: userModel.image,
        })
        .from(memberModel)
        .innerJoin(userModel, eq(memberModel.userId, userModel.id))
        .where(eq(memberModel.organizationId, organizationId)),
      // Get clients (businessPartner type='client' or 'both')
      db
        .select({
          id: businessPartnerModel.id,
          name: businessPartnerModel.name,
          email: businessPartnerModel.email,
        })
        .from(businessPartnerModel)
        .where(
          and(
            eq(businessPartnerModel.organizationId, organizationId),
            inArray(businessPartnerModel.type, ['client', 'both'])
          )
        ),
      // Get real appointments
      appointmentsRepository.getAllByOrganization(organizationId),
    ])

  // Transform members to Staff type
  const staff: Staff[] = membersWithUsers.map((m) => ({
    id: m.memberId,
    userId: m.userId,
    name: m.name,
    email: m.email,
    image: m.image,
  }))

  // Transform business partners to Client type
  const clients: Client[] = businessPartners.map((bp) => ({
    id: bp.id,
    name: bp.name,
    email: bp.email,
  }))

  // Transform appointments to the Appointment type used by calendar components
  const appointments: Appointment[] = appointmentsData.map((apt) => {
    // Map service color to valid appointment color
    const colorMapping: Record<string, Appointment['color']> = {
      blue: 'blue',
      green: 'green',
      orange: 'orange',
      teal: 'teal',
      purple: 'teal', // Map purple to teal as it's not in Appointment type
      red: 'orange', // Map red to orange
      yellow: 'orange', // Map yellow to orange
    }

    return {
      id: apt.id,
      clientId: apt.clientId,
      clientName: apt.clientName,
      serviceId: apt.serviceId,
      serviceName: apt.serviceName,
      staffId: apt.staffId,
      staffName: apt.staffName,
      date: apt.date,
      startTime: apt.startTime,
      endTime: apt.endTime,
      status: apt.status as Appointment['status'],
      color: colorMapping[apt.serviceColor] || 'blue',
      notes: apt.notes || undefined,
    }
  })

  return { staff, clients, appointments }
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData()
  const intent = formData.get('intent')

  if (intent === 'cancel') {
    return await cancelAppointmentAction(request)
  }

  return { success: false, message: 'Invalid action' }
}

export default function AppointmentsPage({ loaderData }: Route.ComponentProps) {
  const { appointments } = loaderData
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [selectedAppointment, setSelectedAppointment] =
    useState<Appointment | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const cancelFetcher = useFetcher()
  const isCancelling = cancelFetcher.state !== 'idle'

  // Handle success toast from redirect
  useEffect(() => {
    const successParam = searchParams.get('success')
    if (successParam === 'appointment_created') {
      toast.success(t('appointments.created'))
      const newParams = new URLSearchParams(searchParams)
      newParams.delete('success')
      setSearchParams(newParams, { replace: true })
    } else if (successParam === 'appointment_updated') {
      toast.success(t('appointments.updated'))
      const newParams = new URLSearchParams(searchParams)
      newParams.delete('success')
      setSearchParams(newParams, { replace: true })
    }
  }, [searchParams, setSearchParams])

  // Handle cancel fetcher response
  useEffect(() => {
    if (cancelFetcher.state === 'idle' && cancelFetcher.data) {
      const data = cancelFetcher.data as { success: boolean; message?: string }
      if (data.success) {
        toast.success(t('appointments.cancelled'))
        setDrawerOpen(false)
      } else {
        toast.error(data.message || t('appointments.cancelFailed'))
      }
    }
  }, [cancelFetcher.state, cancelFetcher.data, t])

  // Get view from URL or default to 'month'
  const viewParam = searchParams.get('view') as CalendarView | null
  const view: CalendarView =
    viewParam && ['day', 'week', 'month'].includes(viewParam)
      ? viewParam
      : 'month'

  // Get date from URL or default to today
  const dateParam = searchParams.get('date')
  const [currentDate, setCurrentDate] = useState(() => {
    if (dateParam) {
      const parsed = new Date(dateParam)
      return isNaN(parsed.getTime()) ? new Date() : parsed
    }
    return new Date()
  })

  // Handle view change
  const handleViewChange = (newView: CalendarView) => {
    setSearchParams((prev) => {
      prev.set('view', newView)
      return prev
    })
  }

  // Handle navigation
  const handleNavigate = (direction: 'prev' | 'next' | 'today') => {
    let newDate: Date

    if (direction === 'today') {
      newDate = new Date()
    } else {
      newDate = new Date(currentDate)
      const offset = direction === 'prev' ? -1 : 1

      switch (view) {
        case 'day':
          newDate.setDate(newDate.getDate() + offset)
          break
        case 'week':
          newDate.setDate(newDate.getDate() + offset * 7)
          break
        case 'month':
          newDate.setMonth(newDate.getMonth() + offset)
          break
      }
    }

    setCurrentDate(newDate)
    setSearchParams((prev) => {
      prev.set('date', newDate.toISOString().split('T')[0])
      return prev
    })
  }

  // Handle clicking on a date in month view
  const handleDateClick = (date: Date) => {
    setCurrentDate(date)
    setSearchParams((prev) => {
      prev.set('date', date.toISOString().split('T')[0])
      prev.set('view', 'day')
      return prev
    })
  }

  // Handle clicking on an appointment
  const handleAppointmentClick = (appointment: (typeof appointments)[0]) => {
    setSelectedAppointment(appointment)
    setDrawerOpen(true)
  }

  // Handle edit appointment
  const handleEditAppointment = (appointment: Appointment) => {
    navigate(`/appointments/${appointment.id}/edit`)
  }

  // Handle cancel appointment
  const handleCancelAppointment = (appointment: Appointment) => {
    if (isCancelling) return

    const formData = new FormData()
    formData.append('intent', 'cancel')
    formData.append('appointmentId', appointment.id)

    cancelFetcher.submit(formData, { method: 'post' })
  }

  return (
    <div className='space-y-4'>
      {/* Calendar Header */}
      <CalendarHeader
        currentDate={currentDate}
        view={view}
        onViewChange={handleViewChange}
        onNavigate={handleNavigate}
      />

      {/* Calendar View */}
      {view === 'month' && (
        <CalendarMonthView
          appointments={appointments}
          currentDate={currentDate}
          onAppointmentClick={handleAppointmentClick}
          onDateClick={handleDateClick}
        />
      )}
      {view === 'week' && (
        <CalendarWeekView
          appointments={appointments}
          currentDate={currentDate}
          onAppointmentClick={handleAppointmentClick}
        />
      )}
      {view === 'day' && (
        <CalendarDayView
          appointments={appointments}
          currentDate={currentDate}
          onAppointmentClick={handleAppointmentClick}
        />
      )}

      {/* Appointment Details Drawer */}
      <AppointmentDetailsDrawer
        appointment={selectedAppointment}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        onEdit={handleEditAppointment}
        onCancel={handleCancelAppointment}
      />
    </div>
  )
}
