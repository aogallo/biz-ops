import { CalendarPlus2 } from 'lucide-react'
import { Link } from 'react-router'

const AppointmentSummary = () => {
  return (
    <section className='col-span-12 flex flex-col rounded-2xl border bg-card shadow-sm lg:col-span-4'>
      <div className='flex items-center justify-between border-b p-5'>
        <h3 className='flex items-center gap-2 text-lg font-bold text-blue-600'>
          <CalendarPlus2 />
          Appointments
        </h3>
        <span className='text-xs font-bold text-slate-400'>Enero 24, 2026</span>
      </div>
      <div className='flex-1 space-y-4 p-5'>
        <div className='rounded-2xl border border-blue-100 bg-blue-50 p-4 dark:border-blue-800/50 dark:bg-blue-900/20'>
          <p className='mb-1 text-xs font-bold text-blue-600 uppercase'>
            Up Next
          </p>
          <div className='flex items-center justify-between'>
            <h4 className='text-lg font-black'>Alex Johnson</h4>
            <span className='rounded bg-blue-600 px-2 py-1 text-[10px] text-white'>
              9:00 AM
            </span>
          </div>
          <p className='mt-1 text-sm text-slate-600 dark:text-slate-400'>
            Business Strategy Session
          </p>
        </div>
        <div className='space-y-3'>
          <div className='flex items-center gap-4 p-2'>
            <p className='w-12 text-center text-xs font-bold text-slate-400'>
              10:30
            </p>
            <div className='h-px flex-1 bg-border' />
          </div>
          <div className='flex items-center gap-4 px-2'>
            <p className='w-12 text-center text-xs font-bold text-slate-400'>
              11:00
            </p>
            <div className='flex-1 rounded-xl border bg-card p-3'>
              <p className='text-xs font-bold'> Mria Garcia</p>
              <p className='text-[10px] text-slate-500'> Service: Consulting</p>
            </div>
          </div>
        </div>
      </div>
      <Link
        className='hover:border-primary hover:text-primary m-5 rounded-xl border-2 border-dashed border-border py-3 text-xs font-bold text-muted-foreground transition-all'
        to='/appointments/calendar'
      >
        Go to Calendar
      </Link>
    </section>
  )
}

export default AppointmentSummary
