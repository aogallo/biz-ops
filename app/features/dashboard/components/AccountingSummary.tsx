import { BanknoteArrowUpIcon } from 'lucide-react'

const AccountingSummary = () => {
  return (
    <section className='dark:bg-card-dark col-span-12 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:col-span-8 dark:border-slate-800'>
      <div className='dark:bg-card-dark flex items-center justify-between border-b border-slate-100 bg-white p-5 dark:border-slate-800'>
        <h2 className='flex items-center gap-2 text-lg font-bold text-emerald-600'>
          <BanknoteArrowUpIcon />
          AccountingSummary
        </h2>
        <div className='flex gap-4'>
          <div className='text-right'>
            <h2 className='text-[10px] font-bold text-slate-400 uppercase'>
              monthly revenue
            </h2>
            <p className='text-lg font-extrabold'>Q 42,889.03</p>
          </div>
        </div>
        <div>
          <div className='text-right'>
            <h2 className='text-[10px] text-slate-400 uppercase'>expenses</h2>
            <p className='text-lg font-extrabold text-rose-500'>Q 19,989.03</p>
          </div>
        </div>
      </div>

      <div className='p-6'>
        <div className='mb-6 grid grid-cols-1 gap-6 md:grid-cols-3'>
          <div className='rounded-xl bg-slate-50 p-4 dark:bg-slate-800/50'>
            <p className='mb-1 text-xs font-bold text-slate-500 uppercase'>
              Pending Invoices
            </p>
            <p className='text-2xl font-black'>18</p>
            <p className='mt-1 text-[15px] font-bold text-amber-500'>
              Due this week
            </p>
          </div>
          <div className='rounded-xl bg-slate-50 p-4 dark:bg-slate-800/50'>
            <p className='mb-1 text-xs font-bold text-slate-500 uppercase'>
              tax provisions
            </p>
            <p className='text-2xl font-black'>Q 5,098</p>
            <p className='mt-1 text-[15px] font-bold text-emerald-500'>
              Ready for SAT
            </p>
          </div>
          <div className='rounded-xl bg-slate-50 p-4 dark:bg-slate-800/50'>
            <p className='mb-1 text-xs font-bold text-slate-500 uppercase'>
              Net Profit
            </p>
            <p className='text-2xl font-black text-emerald-600'>Q 5,098</p>
            <p className='mt-1 text-[15px] font-bold text-emerald-500'>
              Ready for SAT
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

export default AccountingSummary
