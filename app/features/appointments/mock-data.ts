import type { Appointment, Service } from './types'

// Mock services - will be replaced with DB schema later
export const mockServices: Service[] = [
  { id: 'srv-1', name: 'Checkup', duration: 30, color: 'blue' },
  { id: 'srv-2', name: 'Consultation', duration: 45, color: 'green' },
  { id: 'srv-3', name: 'Maintenance', duration: 60, color: 'orange' },
  { id: 'srv-4', name: 'Premium Haircut & Styling', duration: 90, color: 'teal' },
  { id: 'srv-5', name: 'Deep Cleaning', duration: 120, color: 'blue' },
  { id: 'srv-6', name: 'Initial Assessment', duration: 60, color: 'green' },
]

// Helper to get the current week's dates
function getWeekDates(): string[] {
  const today = new Date()
  const dayOfWeek = today.getDay()
  const monday = new Date(today)
  monday.setDate(today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1))

  const dates: string[] = []
  for (let i = 0; i < 5; i++) {
    const date = new Date(monday)
    date.setDate(monday.getDate() + i)
    dates.push(date.toISOString().split('T')[0])
  }
  return dates
}

// Generate mock appointments spread across the current week
export function generateMockAppointments(): Appointment[] {
  const weekDates = getWeekDates()

  return [
    {
      id: 'apt-1',
      clientId: 'client-1',
      clientName: 'Maria Garcia',
      serviceId: 'srv-1',
      serviceName: 'Checkup',
      staffId: 'staff-1',
      staffName: 'Dr. Smith',
      date: weekDates[0],
      startTime: '08:00',
      endTime: '09:30',
      status: 'confirmed',
      color: 'blue',
    },
    {
      id: 'apt-2',
      clientId: 'client-2',
      clientName: 'Juan Rodriguez',
      serviceId: 'srv-2',
      serviceName: 'Consultation',
      staffId: 'staff-2',
      staffName: 'Dr. Johnson',
      date: weekDates[0],
      startTime: '10:00',
      endTime: '11:00',
      status: 'pending',
      color: 'green',
    },
    {
      id: 'apt-3',
      clientId: 'client-3',
      clientName: 'Ana Martinez',
      serviceId: 'srv-3',
      serviceName: 'Maintenance',
      staffId: 'staff-1',
      staffName: 'Dr. Smith',
      date: weekDates[1],
      startTime: '09:00',
      endTime: '10:00',
      status: 'confirmed',
      color: 'orange',
    },
    {
      id: 'apt-4',
      clientId: 'client-4',
      clientName: 'Carlos Lopez',
      serviceId: 'srv-4',
      serviceName: 'Premium Haircut & Styling',
      staffId: 'staff-3',
      staffName: 'Sarah Williams',
      date: weekDates[1],
      startTime: '14:00',
      endTime: '15:30',
      status: 'confirmed',
      color: 'teal',
    },
    {
      id: 'apt-5',
      clientId: 'client-5',
      clientName: 'Elena Sanchez',
      serviceId: 'srv-5',
      serviceName: 'Deep Cleaning',
      staffId: 'staff-2',
      staffName: 'Dr. Johnson',
      date: weekDates[2],
      startTime: '08:00',
      endTime: '10:00',
      status: 'confirmed',
      color: 'blue',
    },
    {
      id: 'apt-6',
      clientId: 'client-1',
      clientName: 'Maria Garcia',
      serviceId: 'srv-6',
      serviceName: 'Initial Assessment',
      staffId: 'staff-1',
      staffName: 'Dr. Smith',
      date: weekDates[2],
      startTime: '11:00',
      endTime: '12:00',
      status: 'pending',
      color: 'green',
    },
    {
      id: 'apt-7',
      clientId: 'client-6',
      clientName: 'Roberto Hernandez',
      serviceId: 'srv-2',
      serviceName: 'Consultation',
      staffId: 'staff-3',
      staffName: 'Sarah Williams',
      date: weekDates[3],
      startTime: '10:00',
      endTime: '11:00',
      status: 'confirmed',
      color: 'green',
    },
    {
      id: 'apt-8',
      clientId: 'client-7',
      clientName: 'Patricia Torres',
      serviceId: 'srv-1',
      serviceName: 'Checkup',
      staffId: 'staff-2',
      staffName: 'Dr. Johnson',
      date: weekDates[3],
      startTime: '15:00',
      endTime: '16:00',
      status: 'pending',
      color: 'blue',
    },
    {
      id: 'apt-9',
      clientId: 'client-8',
      clientName: 'Miguel Ramirez',
      serviceId: 'srv-3',
      serviceName: 'Maintenance',
      staffId: 'staff-1',
      staffName: 'Dr. Smith',
      date: weekDates[4],
      startTime: '09:00',
      endTime: '10:30',
      status: 'confirmed',
      color: 'orange',
    },
    {
      id: 'apt-10',
      clientId: 'client-9',
      clientName: 'Isabella Morales',
      serviceId: 'srv-4',
      serviceName: 'Premium Haircut & Styling',
      staffId: 'staff-3',
      staffName: 'Sarah Williams',
      date: weekDates[4],
      startTime: '13:00',
      endTime: '14:30',
      status: 'confirmed',
      color: 'teal',
    },
  ]
}

// Available time slots for booking (used in TimeSlotGrid)
export const availableTimeSlots = [
  '08:00',
  '08:30',
  '09:00',
  '09:30',
  '10:00',
  '10:30',
  '11:00',
  '11:30',
  '12:00',
  '12:30',
  '13:00',
  '13:30',
  '14:00',
  '14:30',
  '15:00',
  '15:30',
  '16:00',
  '16:30',
  '17:00',
  '17:30',
]
