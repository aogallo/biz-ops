import { cn } from '~/lib/utils'
import type { Appointment } from '../types'
import { AppointmentCard } from './AppointmentCard'

interface CalendarDayViewProps {
  appointments: Appointment[]
  currentDate: Date
  onAppointmentClick?: (appointment: Appointment) => void
}

// Generate time slots from 08:00 to 18:00
const TIME_SLOTS = [
  '08:00',
  '09:00',
  '10:00',
  '11:00',
  '12:00',
  '13:00',
  '14:00',
  '15:00',
  '16:00',
  '17:00',
  '18:00',
]

function isToday(date: Date): boolean {
  const today = new Date()
  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  )
}

function formatDayHeader(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

// Calculate top position from time string
function getTopFromTime(time: string): number {
  const [hours, minutes] = time.split(':').map(Number)
  const startHour = 8
  const hourOffset = hours - startHour
  const minuteOffset = minutes / 60
  return (hourOffset + minuteOffset) * 64 // 64px per hour
}

// Calculate height from duration
function getHeightFromDuration(startTime: string, endTime: string): number {
  const startMinutes =
    parseInt(startTime.split(':')[0]) * 60 + parseInt(startTime.split(':')[1])
  const endMinutes =
    parseInt(endTime.split(':')[0]) * 60 + parseInt(endTime.split(':')[1])
  const durationMinutes = endMinutes - startMinutes
  return (durationMinutes / 60) * 64 // 64px per hour
}

export function CalendarDayView({
  appointments,
  currentDate,
  onAppointmentClick,
}: CalendarDayViewProps) {
  const dateStr = currentDate.toISOString().split('T')[0]
  const dayAppointments = appointments.filter((apt) => apt.date === dateStr)
  const today = isToday(currentDate)

  return (
    <div className='bg-card overflow-auto rounded-lg border'>
      {/* Day header */}
      <div className='bg-card sticky top-0 z-10 border-b p-4'>
        <div className='flex items-center gap-3'>
          <div
            className={cn(
              'text-3xl font-bold',
              today &&
                'bg-primary text-primary-foreground flex h-12 w-12 items-center justify-center rounded-full'
            )}
          >
            {currentDate.getDate()}
          </div>
          <div>
            <div className='text-lg font-semibold'>
              {formatDayHeader(currentDate)}
            </div>
            {today && <div className='text-primary text-sm'>Today</div>}
          </div>
        </div>
      </div>

      {/* Time grid */}
      <div className='flex'>
        {/* Time column */}
        <div className='w-20 shrink-0 border-r'>
          {TIME_SLOTS.map((time) => (
            <div
              key={time}
              className='text-muted-foreground h-16 border-b px-2 pr-3 text-right text-xs'
              style={{ lineHeight: '16px' }}
            >
              {time}
            </div>
          ))}
        </div>

        {/* Day column */}
        <div className={cn('relative flex-1', today && 'bg-primary/5')}>
          {/* Time slot grid lines */}
          {TIME_SLOTS.map((time) => (
            <div
              key={time}
              className='border-muted/50 h-16 border-b border-dashed'
            />
          ))}

          {/* Appointments */}
          {dayAppointments.map((apt) => {
            const top = getTopFromTime(apt.startTime)
            const height = getHeightFromDuration(apt.startTime, apt.endTime)

            return (
              <div
                key={apt.id}
                className='absolute right-2 left-2 z-10'
                style={{
                  top: `${top}px`,
                  height: `${Math.max(height, 32)}px`,
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
      </div>
    </div>
  )
}
