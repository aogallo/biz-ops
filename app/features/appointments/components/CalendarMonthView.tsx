import { cn } from '~/lib/utils'
import type { Appointment } from '../types'

interface CalendarMonthViewProps {
  appointments: Appointment[]
  currentDate: Date
  onAppointmentClick?: (appointment: Appointment) => void
  onDateClick?: (date: Date) => void
}

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

// Get all days to display in the month view (includes days from prev/next months to fill the grid)
function getMonthDays(date: Date): Date[] {
  const year = date.getFullYear()
  const month = date.getMonth()

  // First day of the month
  const firstDay = new Date(year, month, 1)
  // Last day of the month
  const lastDay = new Date(year, month + 1, 0)

  // Start from the Sunday of the week containing the first day
  const startDate = new Date(firstDay)
  startDate.setDate(firstDay.getDate() - firstDay.getDay())

  // End on the Saturday of the week containing the last day
  const endDate = new Date(lastDay)
  endDate.setDate(lastDay.getDate() + (6 - lastDay.getDay()))

  const days: Date[] = []
  const current = new Date(startDate)

  while (current <= endDate) {
    days.push(new Date(current))
    current.setDate(current.getDate() + 1)
  }

  return days
}

function isToday(date: Date): boolean {
  const today = new Date()
  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  )
}

function isSameMonth(date: Date, referenceDate: Date): boolean {
  return (
    date.getFullYear() === referenceDate.getFullYear() &&
    date.getMonth() === referenceDate.getMonth()
  )
}

function formatTime(time: string): string {
  const [hours, minutes] = time.split(':').map(Number)
  const period = hours >= 12 ? 'PM' : 'AM'
  const displayHours = hours % 12 || 12
  return minutes === 0
    ? `${displayHours} ${period}`
    : `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`
}

const appointmentColorClasses: Record<string, string> = {
  blue: 'bg-blue-500 text-white',
  green: 'bg-green-500 text-white',
  orange: 'bg-orange-500 text-white',
  teal: 'bg-teal-500 text-white',
}

export function CalendarMonthView({
  appointments,
  currentDate,
  onAppointmentClick,
  onDateClick,
}: CalendarMonthViewProps) {
  const monthDays = getMonthDays(currentDate)
  const weeks: Date[][] = []

  // Group days into weeks
  for (let i = 0; i < monthDays.length; i += 7) {
    weeks.push(monthDays.slice(i, i + 7))
  }

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
    <div className='bg-card overflow-hidden rounded-lg border'>
      {/* Day of week headers */}
      <div className='bg-muted/30 grid grid-cols-7 border-b'>
        {DAYS_OF_WEEK.map((day) => (
          <div
            key={day}
            className='text-muted-foreground border-r p-2 text-center text-sm font-medium last:border-r-0'
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className='flex flex-col'>
        {weeks.map((week, weekIndex) => (
          <div
            key={weekIndex}
            className='grid grid-cols-7 border-b last:border-b-0'
          >
            {week.map((day) => {
              const dateStr = day.toISOString().split('T')[0]
              const dayAppointments = appointmentsByDate[dateStr] || []
              const today = isToday(day)
              const currentMonth = isSameMonth(day, currentDate)
              const displayAppointments = dayAppointments.slice(0, 3)
              const moreCount = dayAppointments.length - 3

              return (
                <div
                  key={day.toISOString()}
                  className={cn(
                    'hover:bg-accent/50 min-h-[100px] cursor-pointer border-r p-1 transition-colors last:border-r-0',
                    !currentMonth && 'bg-muted/20'
                  )}
                  onClick={() => onDateClick?.(day)}
                >
                  {/* Day number */}
                  <div className='mb-1 flex justify-end'>
                    <span
                      className={cn(
                        'flex h-7 w-7 items-center justify-center rounded-full text-sm',
                        today &&
                          'bg-primary text-primary-foreground font-semibold',
                        !today && !currentMonth && 'text-muted-foreground',
                        !today && currentMonth && 'text-foreground'
                      )}
                    >
                      {day.getDate()}
                    </span>
                  </div>

                  {/* Appointments */}
                  <div className='space-y-0.5'>
                    {displayAppointments.map((apt) => (
                      <button
                        key={apt.id}
                        type='button'
                        className={cn(
                          'w-full truncate rounded px-1 py-0.5 text-left text-xs',
                          appointmentColorClasses[apt.color]
                        )}
                        onClick={(e) => {
                          e.stopPropagation()
                          onAppointmentClick?.(apt)
                        }}
                      >
                        <span className='font-medium'>
                          {formatTime(apt.startTime)}
                        </span>{' '}
                        {apt.clientName}
                      </button>
                    ))}
                    {moreCount > 0 && (
                      <div className='text-muted-foreground px-1 text-xs'>
                        +{moreCount} more
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}
