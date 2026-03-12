import { Download, GitCompare, Shapes } from 'lucide-react'
import { Button } from '~/components/ui/button'

export function QuickActions() {
  return (
    <div>
      <h3 className='mb-4 text-sm font-bold tracking-wider text-slate-500 uppercase'>
        Quick Actions
      </h3>
      <div className='space-y-3'>
        <Button variant='outline' className='w-full justify-start'>
          <Shapes className='mr-2 h-4 w-4' />
          Bulk Assign Category
        </Button>
        <Button variant='outline' className='w-full justify-start'>
          <GitCompare className='mr-2 h-4 w-4' />
          Match to Expense
        </Button>
        <Button variant='outline' className='w-full justify-start'>
          <Download className='mr-2 h-4 w-4' />
          Export to Ledger
        </Button>
      </div>
    </div>
  )
}
