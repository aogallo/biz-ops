import { cn } from '~/lib/utils'
import type { Appointment } from '../types'
import { AppointmentCard } from './AppointmentCard'

interface CalendarGridProps {
  appointments: Appointment[]
  currentDate: Date
  onAppointmentClick?: (appointment: Appointment) => void
}

// Generate time slots from 08:00 to 18:00
const timeSlots = Array.from({ length: 11 }, (_, i) => {
  const hour = i + 8
  return `${hour.toString().padStart(2, '0')}:00`
})

// Get weekday dates (Monday-Friday) for the current week
function getWeekDays(date: Date): Date[] {
  const dayOfWeek = date.getDay()
  const monday = new Date(date)
  monday.setDate(date.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1))

  return Array.from({ length: 5 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return d
  })
}

function formatDayHeader(date: Date): { dayName: string; dayNumber: number } {
  const dayName = date.toLocaleDateString('en-US', { weekday: 'short' })
  const dayNumber = date.getDate()
  return { dayName, dayNumber }
}

function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  )
}

function isToday(date: Date): boolean {
  return isSameDay(date, new Date())
}

// Calculate grid row from time string (e.g., "08:00" -> row 1, "08:30" -> row 2)
function getGridRowFromTime(time: string): number {
  const [hours, minutes] = time.split(':').map(Number)
  const startHour = 8
  return (hours - startHour) * 2 + (minutes >= 30 ? 2 : 1)
}

// Calculate row span from start and end times
function getRowSpan(startTime: string, endTime: string): number {
  const startRow = getGridRowFromTime(startTime)
  const endRow = getGridRowFromTime(endTime)
  return endRow - startRow
}

export function CalendarGrid({
  appointments,
  currentDate,
  onAppointmentClick,
}: CalendarGridProps) {
  const weekDays = getWeekDays(currentDate)

  // Group appointments by date
  const appointmentsByDate = appointments.reduce(
    (acc, apt) => {
      if (!acc[apt.date]) {
        acc[apt.date] = []
      }
      acc[apt.date].push(apt)
      return acc
    },
    {} as Record<string, Appointment[]>
  )

  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      {/* Header row with day names */}
      <div className="grid grid-cols-[80px_repeat(5,1fr)] border-b">
        <div className="border-r p-2" />
        {weekDays.map((day) => {
          const { dayName, dayNumber } = formatDayHeader(day)
          const today = isToday(day)
          return (
            <div
              key={day.toISOString()}
              className={cn(
                'border-r p-3 text-center last:border-r-0',
                today && 'bg-primary/5'
              )}
            >
              <div className="text-sm text-muted-foreground">{dayName}</div>
              <div
                className={cn(
                  'text-2xl font-semibold',
                  today && 'text-primary'
                )}
              >
                {dayNumber}
              </div>
            </div>
          )
        })}
      </div>

      {/* Time grid */}
      <div className="grid grid-cols-[80px_repeat(5,1fr)]">
        {/* Time column */}
        <div className="border-r">
          {timeSlots.map((time) => (
            <div
              key={time}
              className="h-16 border-b px-2 py-1 text-xs text-muted-foreground"
            >
              {time}
            </div>
          ))}
        </div>

        {/* Day columns */}
        {weekDays.map((day) => {
          const dateStr = day.toISOString().split('T')[0]
          const dayAppointments = appointmentsByDate[dateStr] || []
          const today = isToday(day)

          return (
            <div
              key={day.toISOString()}
              className={cn(
                'relative border-r last:border-r-0',
                today && 'bg-primary/5'
              )}
            >
              {/* Time slot backgrounds */}
              {timeSlots.map((time) => (
                <div key={time} className="h-16 border-b border-dashed" />
              ))}

              {/* Appointments positioned absolutely */}
              {dayAppointments.map((apt) => {
                const startRow = getGridRowFromTime(apt.startTime)
                const rowSpan = getRowSpan(apt.startTime, apt.endTime)
                const topOffset = (startRow - 1) * 32 // 32px = half of 64px (h-16)
                const height = rowSpan * 32

                return (
                  <div
                    key={apt.id}
                    className="absolute left-1 right-1"
                    style={{
                      top: `${topOffset}px`,
                      height: `${height}px`,
                    }}
                  >
                    <AppointmentCard
                      appointment={apt}
                      onClick={() => onAppointmentClick?.(apt)}
                    />
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>
    </div>
  )
}
