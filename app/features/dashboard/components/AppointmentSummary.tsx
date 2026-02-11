import { CalendarPlus2, DollarSign, TrendingUp } from 'lucide-react'
import { Link } from 'react-router'

interface TodayAppointment {
  id: string
  date: string
  startTime: string
  endTime: string
  status: string
  clientName: string
  serviceName: string
  serviceColor: string
  staffName: string | null
}

interface NextAppointment {
  id: string
  startTime: string
  clientName: string
  serviceName: string
}

interface AppointmentSummaryProps {
  todayAppointments: TodayAppointment[]
  nextAppointment: NextAppointment | null
  todayDate: string
  monthlyRevenue: number
  occupancyRate: number
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr + 'T00:00:00')
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

const AppointmentSummary = ({
  todayAppointments,
  nextAppointment,
  todayDate,
  monthlyRevenue,
  occupancyRate,
}: AppointmentSummaryProps) => {
  return (
    <section className='col-span-12 flex flex-col rounded-xl bg-card shadow-card lg:col-span-4'>
      {/* Header with domain accent */}
      <div className='flex items-center justify-between border-b border-border/30 p-5'>
        <h3 className='flex items-center gap-2 text-section-header accent-appointments'>
          <CalendarPlus2 className='size-5' />
          Appointments
        </h3>
        <span className='text-caption'>{formatDate(todayDate)}</span>
      </div>

      {/* Content */}
      <div className='flex-1 space-y-4 p-5'>
        {/* Monthly Stats */}
        <div className='grid grid-cols-2 gap-3'>
          <div className='flex items-center gap-2 rounded-lg bg-muted/50 p-3'>
            <DollarSign className='size-4 text-green-600' />
            <div>
              <p className='text-xs text-muted-foreground'>Monthly Revenue</p>
              <p className='text-sm font-semibold'>
                {monthlyRevenue > 0 ? formatCurrency(monthlyRevenue) : '$0.00'}
              </p>
            </div>
          </div>
          <div className='flex items-center gap-2 rounded-lg bg-muted/50 p-3'>
            <TrendingUp className='size-4 text-blue-600' />
            <div>
              <p className='text-xs text-muted-foreground'>Occupancy</p>
              <p className='text-sm font-semibold'>{occupancyRate}%</p>
            </div>
          </div>
        </div>

        {/* Up Next highlight */}
        {nextAppointment ? (
          <div className='rounded-lg accent-appointments-bg p-4'>
            <p className='text-xs font-medium uppercase tracking-wide opacity-80'>
              Up Next
            </p>
            <div className='mt-2 flex items-center justify-between'>
              <h4 className='font-semibold'>{nextAppointment.clientName}</h4>
              <span className='rounded-full bg-blue-600 px-2 py-0.5 text-xs font-medium text-white'>
                {nextAppointment.startTime}
              </span>
            </div>
            <p className='mt-1 text-sm opacity-80'>
              {nextAppointment.serviceName}
            </p>
          </div>
        ) : (
          <div className='rounded-lg border border-dashed border-border/50 p-4 text-center'>
            <p className='text-sm text-muted-foreground'>
              No upcoming appointments today
            </p>
          </div>
        )}

        {/* Timeline */}
        {todayAppointments.length > 0 && (
          <div className='space-y-3'>
            {todayAppointments
              .filter((apt) => apt.id !== nextAppointment?.id)
              .slice(0, 3)
              .map((apt) => (
                <div key={apt.id} className='flex items-center gap-4 px-2'>
                  <p className='w-12 text-center text-caption'>
                    {apt.startTime.slice(0, 5)}
                  </p>
                  <div className='flex-1 rounded-lg bg-muted/50 p-3'>
                    <p className='text-sm font-medium'>{apt.clientName}</p>
                    <p className='text-caption'>Service: {apt.serviceName}</p>
                  </div>
                </div>
              ))}
          </div>
        )}

        {todayAppointments.length === 0 && !nextAppointment && (
          <div className='py-4 text-center'>
            <p className='text-sm text-muted-foreground'>
              No appointments scheduled for today
            </p>
          </div>
        )}
      </div>

      {/* Action link */}
      <Link
        className='m-5 flex items-center justify-center rounded-lg border border-dashed border-border/50 py-3 text-sm font-medium text-muted-foreground transition-colors hover:border-primary hover:text-primary'
        to='/appointments'
      >
        Go to Calendar
      </Link>
    </section>
  )
}

export default AppointmentSummary
