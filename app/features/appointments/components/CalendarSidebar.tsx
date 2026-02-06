import { Lightbulb } from 'lucide-react'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import type { Appointment } from '../types'
import { UpcomingAppointmentItem } from './UpcomingAppointmentItem'

interface CalendarSidebarProps {
  appointments: Appointment[]
}

interface StatCardProps {
  label: string
  value: number
  colorClass?: string
}

function StatCard({ label, value, colorClass }: StatCardProps) {
  return (
    <div className="rounded-lg border bg-card p-3 text-center">
      <div className={`text-2xl font-bold ${colorClass || ''}`}>{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  )
}

export function CalendarSidebar({ appointments }: CalendarSidebarProps) {
  // Get today's date string
  const todayStr = new Date().toISOString().split('T')[0]

  // Filter appointments for today
  const todayAppointments = appointments.filter((apt) => apt.date === todayStr)

  // Calculate stats
  const totalBookings = todayAppointments.length
  const confirmedCount = todayAppointments.filter(
    (apt) => apt.status === 'confirmed'
  ).length
  const pendingCount = todayAppointments.filter(
    (apt) => apt.status === 'pending'
  ).length

  // Available slots (assuming 10 slots per day max)
  const availableSlots = Math.max(0, 10 - totalBookings)

  // Get upcoming appointments (next 4 from today onwards)
  const upcomingAppointments = appointments
    .filter((apt) => {
      const aptDate = new Date(apt.date + 'T' + apt.startTime)
      return aptDate >= new Date()
    })
    .sort((a, b) => {
      const dateA = new Date(a.date + 'T' + a.startTime)
      const dateB = new Date(b.date + 'T' + b.startTime)
      return dateA.getTime() - dateB.getTime()
    })
    .slice(0, 4)

  return (
    <div className="space-y-6">
      {/* Daily Summary */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Daily Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2">
            <StatCard label="Bookings" value={totalBookings} />
            <StatCard
              label="Available"
              value={availableSlots}
              colorClass="text-teal-600"
            />
            <StatCard
              label="Confirmed"
              value={confirmedCount}
              colorClass="text-green-600"
            />
            <StatCard
              label="Pending"
              value={pendingCount}
              colorClass="text-orange-600"
            />
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Appointments */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Upcoming Appointments</CardTitle>
        </CardHeader>
        <CardContent>
          {upcomingAppointments.length > 0 ? (
            <div className="divide-y">
              {upcomingAppointments.map((apt) => (
                <UpcomingAppointmentItem key={apt.id} appointment={apt} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No upcoming appointments
            </p>
          )}
        </CardContent>
      </Card>

      {/* Smart Suggestion */}
      <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-primary/10 p-2">
              <Lightbulb className="size-5 text-primary" />
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-sm">Smart Suggestion</h4>
              <p className="text-xs text-muted-foreground mt-1">
                {pendingCount > 0
                  ? `You have ${pendingCount} pending appointment${pendingCount > 1 ? 's' : ''}. Consider sending confirmation reminders.`
                  : availableSlots > 5
                    ? 'Low booking rate today. Consider reaching out to clients who haven\'t visited recently.'
                    : 'Great booking rate! Keep up the good work.'}
              </p>
              <Button variant="outline" size="sm" className="mt-3">
                Generate Campaign
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
