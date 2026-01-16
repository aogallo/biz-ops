import { CloudUpload, Download, GitCompare, Search, Shapes } from 'lucide-react'
import { DataTable } from '~/components/dataTable/DataTable'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'
import { getAccountingAccountsByOrganization } from '~/features/accounting-account/server/actions/read.actions'
import { requireAuth } from '~/server/auth/session.server'
import { SatFileColumns } from '../components/Columns'
import type { Route } from './+types'

export async function loader({ request }: Route.LoaderArgs) {
  const session = await requireAuth(request)

  if (!session.session.activeOrganizationId) {
    return { accounts: [] }
  }

  const accounts = await getAccountingAccountsByOrganization(
    session.session.activeOrganizationId
  )

  return { accounts }
}

const SATProcessorIndex = ({ loaderData }: Route.ComponentProps) => {
  const { accounts } = loaderData
  return (
    <div className='flex flex-1 overflow-hidden'>
      <div className='flex-1'>
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
        <div className='flex flex-1 flex-col overflow-hidden p-6'>
          <div className='mb-4 flex items-center justify-between'>
            <div className='flex items-center gap-2'>
              <h2 className='text-lg font-bold'>Processed Invoices</h2>
              <span className='rounded bg-slate-100 px-2 text-sm text-slate-500 dark:bg-slate-800'>
                December 2025
              </span>
            </div>
            <div className='flex items-center gap-2'>
              <div className='flex items-center'>
                <Search className='relative' />
                <Input />
                Filter
              </div>
            </div>
          </div>
          <DataTable columns={SatFileColumns} data={[]} />
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
            <Select>
              <SelectTrigger className='w-full'>
                <SelectValue placeholder='Select an account' />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel> Accounts</SelectLabel>

                  {accounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </div>
      </aside>
    </div>
  )
}

export default SATProcessorIndex
