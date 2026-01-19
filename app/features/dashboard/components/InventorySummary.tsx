import { CirclePile } from 'lucide-react'
import { Link } from 'react-router'

const InventorySummary = () => {
  return (
    <section className='dark:bg-card-dark col-span-12 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:col-span-4 dark:border-slate-800'>
      <div className='border-b border-slate-100 bg-slate-50/50 p-5 dark:border-slate-800 dark:bg-slate-800/20'>
        <h3 className='flex items-center gap-2 text-lg font-bold text-amber-600'>
          <CirclePile />
          Inventory Alerts
        </h3>
      </div>
      <div className='space-y-5 p-6'>
        <div className='space-y-2'>
          <div className='flex items-center justify-between'>
            <p className='text-sm font-bold'> Cloud Nodes X</p>
            <p className='text-xs font-bold text-rose-500'>Critical: 12 left</p>
          </div>
          <div className='h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700'>
            <div className='h-full w-[15%] bg-rose-500' />
          </div>
        </div>
        <div className='space-y-2'>
          <div className='flex items-center justify-between'>
            <p className='text-sm font-bold'>Security Hubs</p>
            <p className='text-xs font-bold text-amber-500'>Low: 54 left</p>
          </div>
          <div className='h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700'>
            <div className='h-full w-[45%] bg-amber-500' />
          </div>
        </div>
        <button
          type='button'
          className='w-full rounded-xl bg-slate-900 py-3 text-sm font-bold text-white dark:bg-slate-100 dark:text-slate-900'
        >
          <Link to='/inventory'>Restock module</Link>
        </button>
      </div>
    </section>
  )
}

export default InventorySummary
