import {
  CalendarIcon,
  ClockIcon,
  UserIcon,
  BriefcaseIcon,
  FileTextIcon,
} from 'lucide-react'
import { Button } from '~/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '~/components/ui/sheet'
import type { Appointment } from '../types'

interface AppointmentDetailsDrawerProps {
  appointment: Appointment | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onEdit?: (appointment: Appointment) => void
  onCancel?: (appointment: Appointment) => void
}

// Semantic status classes per system.md
const statusConfig = {
  confirmed: {
    label: 'Confirmed',
    className: 'status-success',
  },
  pending: {
    label: 'Pending',
    className: 'status-warning',
  },
  cancelled: {
    label: 'Cancelled',
    className: 'status-error',
  },
}

const colorConfig = {
  blue: 'bg-blue-500',
  green: 'bg-green-500',
  orange: 'bg-orange-500',
  teal: 'bg-teal-500',
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function formatTimeRange(startTime: string, endTime: string): string {
  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':')
    const h = parseInt(hours, 10)
    const suffix = h >= 12 ? 'PM' : 'AM'
    const hour12 = h > 12 ? h - 12 : h === 0 ? 12 : h
    return `${hour12}:${minutes} ${suffix}`
  }
  return `${formatTime(startTime)} - ${formatTime(endTime)}`
}

export function AppointmentDetailsDrawer({
  appointment,
  open,
  onOpenChange,
  onEdit,
  onCancel,
}: AppointmentDetailsDrawerProps) {
  if (!appointment) return null

  const status = statusConfig[appointment.status]

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md">
        <SheetHeader>
          <div className="flex items-center gap-3">
            <div className={`size-3 rounded-full ${colorConfig[appointment.color]}`} />
            <SheetTitle className="text-section-header">{appointment.serviceName}</SheetTitle>
          </div>
          <SheetDescription>
            Appointment details and information
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto py-6">
          {/* Status Badge */}
          <div className="mb-6">
            <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${status.className}`}>
              {status.label}
            </span>
          </div>

          {/* Details Section */}
          <div className="space-y-5">
            {/* Client */}
            <div className="flex items-start gap-3">
              <UserIcon className="mt-0.5 size-5 text-muted-foreground" />
              <div>
                <p className="text-caption">Client</p>
                <p className="font-medium">{appointment.clientName}</p>
              </div>
            </div>

            {/* Service */}
            <div className="flex items-start gap-3">
              <BriefcaseIcon className="mt-0.5 size-5 text-muted-foreground" />
              <div>
                <p className="text-caption">Service</p>
                <p className="font-medium">{appointment.serviceName}</p>
              </div>
            </div>

            {/* Staff */}
            <div className="flex items-start gap-3">
              <UserIcon className="mt-0.5 size-5 text-muted-foreground" />
              <div>
                <p className="text-caption">Staff</p>
                <p className="font-medium">{appointment.staffName}</p>
              </div>
            </div>

            {/* Date */}
            <div className="flex items-start gap-3">
              <CalendarIcon className="mt-0.5 size-5 text-muted-foreground" />
              <div>
                <p className="text-caption">Date</p>
                <p className="font-medium">{formatDate(appointment.date)}</p>
              </div>
            </div>

            {/* Time */}
            <div className="flex items-start gap-3">
              <ClockIcon className="mt-0.5 size-5 text-muted-foreground" />
              <div>
                <p className="text-caption">Time</p>
                <p className="font-medium text-data">
                  {formatTimeRange(appointment.startTime, appointment.endTime)}
                </p>
              </div>
            </div>

            {/* Notes (if present) */}
            {appointment.notes && (
              <div className="flex items-start gap-3">
                <FileTextIcon className="mt-0.5 size-5 text-muted-foreground" />
                <div>
                  <p className="text-caption">Notes</p>
                  <p className="text-sm text-muted-foreground">{appointment.notes}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <SheetFooter className="flex-row gap-2 sm:flex-row">
          {appointment.status !== 'cancelled' && (
            <>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => onEdit?.(appointment)}
              >
                Edit
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                onClick={() => onCancel?.(appointment)}
              >
                Cancel Appointment
              </Button>
            </>
          )}
          {appointment.status === 'cancelled' && (
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Close
            </Button>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
