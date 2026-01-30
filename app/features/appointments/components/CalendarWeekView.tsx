import { cn } from '~/lib/utils'
import type { Appointment } from '../types'
import { AppointmentCard } from './AppointmentCard'

interface CalendarWeekViewProps {
  appointments: Appointment[]
  currentDate: Date
  onAppointmentClick?: (appointment: Appointment) => void
}

// Generate time slots from 08:00 to 18:00
const TIME_SLOTS = [
  '08:00', '09:00', '10:00', '11:00', '12:00',
  '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'
]

// Get weekday dates (Sunday-Saturday) for the current week
function getWeekDays(date: Date): Date[] {
  const dayOfWeek = date.getDay()
  const sunday = new Date(date)
  sunday.setDate(date.getDate() - dayOfWeek)

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(sunday)
    d.setDate(sunday.getDate() + i)
    return d
  })
}

function formatDayHeader(date: Date): { dayName: string; dayNumber: number } {
  const dayName = date.toLocaleDateString('en-US', { weekday: 'short' })
  const dayNumber = date.getDate()
  return { dayName, dayNumber }
}

function isToday(date: Date): boolean {
  const today = new Date()
  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  )
}

// Calculate top position from time string (e.g., "08:00" -> 0, "09:00" -> 64)
function getTopFromTime(time: string): number {
  const [hours, minutes] = time.split(':').map(Number)
  const startHour = 8
  const hourOffset = hours - startHour
  const minuteOffset = minutes / 60
  return (hourOffset + minuteOffset) * 64 // 64px per hour
}

// Calculate height from duration
function getHeightFromDuration(startTime: string, endTime: string): number {
  const startMinutes = parseInt(startTime.split(':')[0]) * 60 + parseInt(startTime.split(':')[1])
  const endMinutes = parseInt(endTime.split(':')[0]) * 60 + parseInt(endTime.split(':')[1])
  const durationMinutes = endMinutes - startMinutes
  return (durationMinutes / 60) * 64 // 64px per hour
}

export function CalendarWeekView({
  appointments,
  currentDate,
  onAppointmentClick,
}: CalendarWeekViewProps) {
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
    <div className="rounded-lg border bg-card overflow-auto">
      {/* Sticky header row with day names */}
      <div className="sticky top-0 z-10 bg-card border-b">
        <div className="flex">
          {/* Time column header */}
          <div className="w-16 shrink-0 border-r p-2" />
          {/* Day headers */}
          {weekDays.map((day) => {
            const { dayName, dayNumber } = formatDayHeader(day)
            const today = isToday(day)
            return (
              <div
                key={day.toISOString()}
                className={cn(
                  'flex-1 min-w-[100px] border-r last:border-r-0 p-2 text-center',
                  today && 'bg-primary/5'
                )}
              >
                <div className="text-xs text-muted-foreground uppercase">{dayName}</div>
                <div
                  className={cn(
                    'text-xl font-semibold',
                    today && 'bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center mx-auto'
                  )}
                >
                  {dayNumber}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Time grid body */}
      <div className="flex">
        {/* Time column */}
        <div className="w-16 shrink-0 border-r">
          {TIME_SLOTS.map((time) => (
            <div
              key={time}
              className="h-16 border-b px-2 text-xs text-muted-foreground text-right pr-2"
              style={{ lineHeight: '16px' }}
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
                'flex-1 min-w-[100px] border-r last:border-r-0 relative',
                today && 'bg-primary/5'
              )}
            >
              {/* Time slot grid lines */}
              {TIME_SLOTS.map((time) => (
                <div key={time} className="h-16 border-b border-dashed border-muted/50" />
              ))}

              {/* Appointments positioned absolutely */}
              {dayAppointments.map((apt) => {
                const top = getTopFromTime(apt.startTime)
                const height = getHeightFromDuration(apt.startTime, apt.endTime)

                return (
                  <div
                    key={apt.id}
                    className="absolute left-0.5 right-0.5 z-10"
                    style={{
                      top: `${top}px`,
                      height: `${Math.max(height, 24)}px`,
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
