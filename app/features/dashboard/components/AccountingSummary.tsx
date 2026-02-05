import { BanknoteArrowUpIcon } from 'lucide-react'

const AccountingSummary = () => {
  return (
    <section className='col-span-12 overflow-hidden rounded-xl bg-card shadow-card lg:col-span-8'>
      {/* Header with domain accent color */}
      <div className='flex items-center justify-between border-b border-border/30 p-5'>
        <h2 className='flex items-center gap-2 text-section-header accent-accounting'>
          <BanknoteArrowUpIcon className='size-5' />
          Accounting Summary
        </h2>
        <div className='flex gap-6'>
          <div className='text-right'>
            <p className='text-caption uppercase tracking-wide'>
              Monthly Revenue
            </p>
            <p className='text-lg font-semibold text-data'>Q 42,889.03</p>
          </div>
          <div className='text-right'>
            <p className='text-caption uppercase tracking-wide'>Expenses</p>
            <p className='text-lg font-semibold text-data status-error inline-block rounded px-1'>
              Q 19,989.03
            </p>
          </div>
        </div>
      </div>

      {/* Metrics grid */}
      <div className='p-6'>
        <div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
          {/* Pending Invoices */}
          <div className='rounded-lg bg-muted/50 p-4'>
            <p className='text-caption uppercase tracking-wide'>
              Pending Invoices
            </p>
            <p className='mt-1 text-2xl font-semibold text-data'>18</p>
            <p className='mt-2 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium status-warning'>
              Due this week
            </p>
          </div>

          {/* Tax Provisions */}
          <div className='rounded-lg bg-muted/50 p-4'>
            <p className='text-caption uppercase tracking-wide'>
              Tax Provisions
            </p>
            <p className='mt-1 text-2xl font-semibold text-data'>Q 5,098</p>
            <p className='mt-2 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium status-success'>
              Ready for SAT
            </p>
          </div>

          {/* Net Profit */}
          <div className='rounded-lg bg-muted/50 p-4'>
            <p className='text-caption uppercase tracking-wide'>
              Net Profit
            </p>
            <p className='mt-1 text-2xl font-semibold text-data accent-accounting'>
              Q 5,098
            </p>
            <p className='mt-2 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium status-success'>
              Positive margin
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

export default AccountingSummary
