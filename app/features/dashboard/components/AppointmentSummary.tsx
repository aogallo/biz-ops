import { CalendarPlus2 } from 'lucide-react'
import { Link } from 'react-router'

const AppointmentSummary = () => {
  return (
    <section className='col-span-12 flex flex-col rounded-xl bg-card shadow-card lg:col-span-4'>
      {/* Header with domain accent */}
      <div className='flex items-center justify-between border-b border-border/30 p-5'>
        <h3 className='flex items-center gap-2 text-section-header accent-appointments'>
          <CalendarPlus2 className='size-5' />
          Appointments
        </h3>
        <span className='text-caption'>Enero 24, 2026</span>
      </div>

      {/* Content */}
      <div className='flex-1 space-y-4 p-5'>
        {/* Up Next highlight */}
        <div className='rounded-lg accent-appointments-bg p-4'>
          <p className='text-xs font-medium uppercase tracking-wide opacity-80'>
            Up Next
          </p>
          <div className='mt-2 flex items-center justify-between'>
            <h4 className='font-semibold'>Alex Johnson</h4>
            <span className='rounded-full bg-blue-600 px-2 py-0.5 text-xs font-medium text-white'>
              9:00 AM
            </span>
          </div>
          <p className='mt-1 text-sm opacity-80'>
            Business Strategy Session
          </p>
        </div>

        {/* Timeline */}
        <div className='space-y-3'>
          <div className='flex items-center gap-4 p-2'>
            <p className='w-12 text-center text-caption'>
              10:30
            </p>
            <div className='h-px flex-1 bg-border/50' />
          </div>
          <div className='flex items-center gap-4 px-2'>
            <p className='w-12 text-center text-caption'>
              11:00
            </p>
            <div className='flex-1 rounded-lg bg-muted/50 p-3'>
              <p className='text-sm font-medium'>Maria Garcia</p>
              <p className='text-caption'>Service: Consulting</p>
            </div>
          </div>
        </div>
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
