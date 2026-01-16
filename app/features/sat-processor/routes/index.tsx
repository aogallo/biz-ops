import { CloudUpload, Download, GitCompare, Shapes } from 'lucide-react'
import { Button } from '~/components/ui/button'

const SATProcessorIndex = () => {
  return (
    <div className='flex'>
      <div className='space-y-6 p-6 pb-0'>
        <div className='flex flex-col items-center justify-center gap-4 rounded-lg border-2 border-dashed border-slate-300 p-6 text-center dark:border-slate-700'>
          <CloudUpload className='h-12 w-12 text-slate-400' />
          <h3 className='text-base font-semibold'>
            Upload SAT Export (CSV or XLS)
          </h3>
          <p className='mt-1 text-sm text-slate-500 dark:text-slate-400'>
            Drag and drop your FEL export files here or click to browser
          </p>
          <span className='rounded border border-slate-200 bg-slate-100 px-2 py-1 text-[12px] font-bold uppercase dark:border-slate-700 dark:bg-slate-800'>
            Supported: .csv, .xls
          </span>
          <div className='mt-4 flex gap-2'>
            <button
              type='button'
              className='inline-flex items-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50'
            >
              Upload File
            </button>
            <button
              type='button'
              className='inline-flex items-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50'
            >
              Download Template
            </button>
          </div>
        </div>
      </div>
      <aside className='w-1/3 border-l border-slate-200 p-6 dark:border-slate-700'>
        <div>
          <h3 className='mb-4 text-sm font-bold tracking-wider text-slate-500 uppercase'>
            Quick Actions
          </h3>
          <div className='space-y-3'>
            <Button variant='outline' className='w-full justify-start'>
              <Shapes />
              Bulk Assign Category
            </Button>
            <Button variant='outline' className='w-full justify-start'>
              <GitCompare />
              Match to Expense
            </Button>
            <Button variant='outline' className='w-full justify-start'>
              <Download />
              Export to Ledger
            </Button>
          </div>
        </div>
        <div className='h-px bg-slate-200 dark:bg-slate-800'></div>
        <div>
          <h3 className='mt-6 mb-4 text-sm font-bold tracking-wider text-slate-500 uppercase'>
            Selected row details
          </h3>
          <div className='space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50'>
            <div className='flex items-center justify-between'>
              <span className='text-sm text-slate-500'>Document Type</span>
              <span className='rounded bg-slate-200 px-2 py-0.5 text-xs font-bold dark:bg-slate-700'>
                FACT FEL
              </span>
            </div>
            <div className='flex items-center justify-between'>
              <span className='text-sm text-slate-500'>IVA</span>
              <span className='text-sm font-medium'>Q 123.33</span>
            </div>
            <div className='flex items-center justify-between'>
              <span className='text-sm text-slate-500'>Exempt</span>
              <span className='text-sm font-medium'>Q 0.00</span>
            </div>
            <div className='flex items-center justify-between'>
              <span className='text-xs text-slate-500'>Currency</span>
              <span className='text-xs font-medium'>GTQ (Quetzales)</span>
            </div>
          </div>
          <div className='border-t border-slate-200 pt-2 dark:border-slate-700'>
            <span className='text-sm text-slate-500 dark:border-slate-700'>
              Accounting Account
            </span>
          </div>
        </div>
      </aside>
    </div>
  )
}

export default SATProcessorIndex
