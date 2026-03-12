import { BanknoteArrowUpIcon } from 'lucide-react'

const AccountingSummary = () => {
  return (
    <section className='bg-card shadow-card col-span-12 overflow-hidden rounded-xl lg:col-span-8'>
      {/* Header with domain accent color */}
      <div className='border-border/30 flex items-center justify-between border-b p-5'>
        <h2 className='text-section-header accent-accounting flex items-center gap-2'>
          <BanknoteArrowUpIcon className='size-5' />
          Accounting Summary
        </h2>
        <div className='flex gap-6'>
          <div className='text-right'>
            <p className='text-caption tracking-wide uppercase'>
              Monthly Revenue
            </p>
            <p className='text-data text-lg font-semibold'>Q 42,889.03</p>
          </div>
          <div className='text-right'>
            <p className='text-caption tracking-wide uppercase'>Expenses</p>
            <p className='text-data status-error inline-block rounded px-1 text-lg font-semibold'>
              Q 19,989.03
            </p>
          </div>
        </div>
      </div>

      {/* Metrics grid */}
      <div className='p-6'>
        <div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
          {/* Pending Invoices */}
          <div className='bg-muted/50 rounded-lg p-4'>
            <p className='text-caption tracking-wide uppercase'>
              Pending Invoices
            </p>
            <p className='text-data mt-1 text-2xl font-semibold'>18</p>
            <p className='status-warning mt-2 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium'>
              Due this week
            </p>
          </div>

          {/* Tax Provisions */}
          <div className='bg-muted/50 rounded-lg p-4'>
            <p className='text-caption tracking-wide uppercase'>
              Tax Provisions
            </p>
            <p className='text-data mt-1 text-2xl font-semibold'>Q 5,098</p>
            <p className='status-success mt-2 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium'>
              Ready for SAT
            </p>
          </div>

          {/* Net Profit */}
          <div className='bg-muted/50 rounded-lg p-4'>
            <p className='text-caption tracking-wide uppercase'>Net Profit</p>
            <p className='text-data accent-accounting mt-1 text-2xl font-semibold'>
              Q 5,098
            </p>
            <p className='status-success mt-2 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium'>
              Positive margin
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

export default AccountingSummary
