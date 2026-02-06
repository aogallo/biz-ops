import { CirclePile } from 'lucide-react'
import { Link } from 'react-router'
import { Button } from '~/components/ui/button'

const InventorySummary = () => {
  return (
    <section className='col-span-12 overflow-hidden rounded-xl bg-card shadow-card lg:col-span-4'>
      {/* Header with domain accent */}
      <div className='border-b border-border/30 p-5'>
        <h3 className='flex items-center gap-2 text-section-header accent-inventory'>
          <CirclePile className='size-5' />
          Inventory Alerts
        </h3>
      </div>

      {/* Content */}
      <div className='space-y-5 p-6'>
        {/* Critical item */}
        <div className='space-y-2'>
          <div className='flex items-center justify-between'>
            <p className='text-sm font-medium'>Cloud Nodes X</p>
            <p className='inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium status-error'>
              Critical: 12 left
            </p>
          </div>
          <div className='h-2 w-full overflow-hidden rounded-full bg-muted'>
            <div className='h-full w-[15%] rounded-full bg-red-500' />
          </div>
        </div>

        {/* Low stock item */}
        <div className='space-y-2'>
          <div className='flex items-center justify-between'>
            <p className='text-sm font-medium'>Security Hubs</p>
            <p className='inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium status-warning'>
              Low: 54 left
            </p>
          </div>
          <div className='h-2 w-full overflow-hidden rounded-full bg-muted'>
            <div className='h-full w-[45%] rounded-full bg-amber-500' />
          </div>
        </div>

        {/* Action button */}
        <Button asChild className='w-full'>
          <Link to='/products'>Restock Module</Link>
        </Button>
      </div>
    </section>
  )
}

export default InventorySummary
