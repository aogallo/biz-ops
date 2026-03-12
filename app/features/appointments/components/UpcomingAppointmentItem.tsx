import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar'
import type { Appointment } from '../types'

interface UpcomingAppointmentItemProps {
  appointment: Appointment
  clientImage?: string | null
}

export function UpcomingAppointmentItem({
  appointment,
  clientImage,
}: UpcomingAppointmentItemProps) {
  const initials = appointment.clientName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <div className='flex items-center gap-3 py-2'>
      <Avatar className='size-9'>
        <AvatarImage
          src={clientImage || undefined}
          alt={appointment.clientName}
        />
        <AvatarFallback className='text-xs'>{initials}</AvatarFallback>
      </Avatar>
      <div className='min-w-0 flex-1'>
        <div className='truncate text-sm font-medium'>
          {appointment.clientName}
        </div>
        <div className='text-muted-foreground text-xs'>
          {appointment.startTime} - {appointment.serviceName}
        </div>
      </div>
      <div className='text-muted-foreground text-xs'>
        {appointment.staffName}
      </div>
    </div>
  )
}
