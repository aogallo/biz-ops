// Service - no DB schema yet, mock only
export interface Service {
  id: string
  name: string
  duration: number // minutes
  color: string
}

// Appointment - no DB schema yet, mock only
export interface Appointment {
  id: string
  clientId: string // references businessPartner.id
  clientName: string // denormalized for display
  serviceId: string // references mock service
  serviceName: string // denormalized for display
  staffId: string // references member.id
  staffName: string // denormalized for display
  date: string // ISO date (YYYY-MM-DD)
  startTime: string // HH:mm
  endTime: string // HH:mm
  status: 'confirmed' | 'pending' | 'cancelled'
  color: 'blue' | 'green' | 'orange' | 'teal'
  notes?: string
}

export type CalendarView = 'day' | 'week' | 'month'

export type AppointmentColor = Appointment['color']

// Staff representation for the calendar (from member + user)
export interface Staff {
  id: string // member.id
  userId: string
  name: string
  email: string
  image: string | null
}

// Client representation (from businessPartner)
export interface Client {
  id: string
  name: string
  email: string | null
}
