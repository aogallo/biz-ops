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
    <div className="flex items-center gap-3 py-2">
      <Avatar className="size-9">
        <AvatarImage src={clientImage || undefined} alt={appointment.clientName} />
        <AvatarFallback className="text-xs">{initials}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm truncate">{appointment.clientName}</div>
        <div className="text-xs text-muted-foreground">
          {appointment.startTime} - {appointment.serviceName}
        </div>
      </div>
      <div className="text-xs text-muted-foreground">{appointment.staffName}</div>
    </div>
  )
}
