import { cn } from '~/lib/utils'
import type { Appointment, AppointmentColor } from '../types'

interface AppointmentCardProps {
  appointment: Appointment
  onClick?: () => void
}

const colorClasses: Record<AppointmentColor, string> = {
  blue: 'border-l-blue-500 bg-blue-50 dark:bg-blue-950/30',
  green: 'border-l-green-500 bg-green-50 dark:bg-green-950/30',
  orange: 'border-l-orange-500 bg-orange-50 dark:bg-orange-950/30',
  teal: 'border-l-teal-500 bg-teal-50 dark:bg-teal-950/30',
}

export function AppointmentCard({
  appointment,
  onClick,
}: AppointmentCardProps) {
  return (
    <div
      className={cn(
        'cursor-pointer rounded-md border-l-4 p-2 transition-shadow hover:shadow-md',
        colorClasses[appointment.color]
      )}
      onClick={onClick}
    >
      <div className='text-muted-foreground text-xs'>
        {appointment.startTime} - {appointment.endTime}
      </div>
      <div className='truncate text-sm font-medium'>
        {appointment.clientName}
      </div>
      <div className='text-muted-foreground truncate text-xs'>
        {appointment.serviceName}
      </div>
    </div>
  )
}
