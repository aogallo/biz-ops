import { and, eq, inArray } from 'drizzle-orm'
import { useState } from 'react'
import { useSearchParams } from 'react-router'
import {
  CalendarDayView,
  CalendarHeader,
  CalendarMonthView,
  CalendarWeekView,
} from '~/features/appointments/components'
import { generateMockAppointments, mockServices } from '~/features/appointments/mock-data'
import type { CalendarView, Client, Staff } from '~/features/appointments/types'
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
      services: mockServices,
      appointments: generateMockAppointments(),
    }
  }

  // Fetch real data from DB in parallel
  const [membersWithUsers, businessPartners] = await Promise.all([
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

  // Mock services and appointments for now
  const services = mockServices
  const appointments = generateMockAppointments()

  return { staff, clients, services, appointments }
}

export default function AppointmentsPage({ loaderData }: Route.ComponentProps) {
  const { appointments } = loaderData
  const [searchParams, setSearchParams] = useSearchParams()

  // Get view from URL or default to 'month'
  const viewParam = searchParams.get('view') as CalendarView | null
  const view: CalendarView = viewParam && ['day', 'week', 'month'].includes(viewParam)
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
  const handleAppointmentClick = (appointment: typeof appointments[0]) => {
    console.log('Clicked appointment:', appointment)
    // TODO: Navigate to appointment detail or open edit modal
  }

  return (
    <div className="space-y-4">
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
    </div>
  )
}
