import { Hash, MapPinCheck, TrendingUpIcon } from 'lucide-react'
import { Button } from '~/components/ui/button'
import { requireAuth } from '~/server/auth/session.server'
import { getCompanyById } from '../server/loaders'
import type { Route } from './+types/show'

export async function loader({ params, request }: Route.LoaderArgs) {
  const { companyId } = params
  const session = await requireAuth(request)
  if (!session.session.activeOrganizationId) {
    return {}
  }
  const data = await getCompanyById(
    session.session.activeOrganizationId,
    companyId
  )

  if (!data) {
    return {}
  }

  return { company: data }
}
const CompanyShow = ({ loaderData }: Route.ComponentProps) => {
  const company = loaderData.company
  return (
    <div className='flex-1 space-y-8 overflow-y-auto'>
      <div className='flex flex-col items-start justify-between gap-6 rounded-xl border border-slate-100 bg-white p-8 shadow-sm md:flex-row md:items-end dark:border-gray-800 dark:bg-gray-900'>
        <div className='flex items-center gap-6'>
          <h2
            className='shadow-primary/20 flex size-24 items-center justify-center rounded-2xl bg-linear-to-br from-teal-200 to-teal-600 text-3xl font-bold text-white shadow-lg'
            data-alt={company?.name}
          >
            Ab
          </h2>
          <div className='space-y-1'>
            <div className='flex items-center gap-3'>
              <h2 className='text-3xl font-extrabold tracking-tight text-[#0e181b] dark:text-white'>
                {company?.name}
              </h2>
              <span className='flex items-center gap-1.5 rounded-full bg-green-100 px-3 text-xs font-bold tracking-widest text-green-700 uppercase dark:bg-green-900/30 dark:text-green-400'>
                <span className='size-2 rounded-full bg-green-500'></span>
                Active
              </span>
            </div>
            <div className='flex gap-4 font-medium text-[#508a95]'>
              <span className='flex items-center gap-1'>
                <MapPinCheck />
                Guatemala, Guatemala
              </span>
              <span className='flex items-center gap-1'>
                <Hash />
                123
              </span>
            </div>
          </div>
        </div>
        <div className='flex w-full gap-3 md:w-auto'>
          <Button variant='outline'>Edit Details</Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className='grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4'>
        <section className='group relative overflow-hidden rounded-xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900'>
          <div className='bg-primary absolute top-0 left-0 h-full w-1'></div>
          <p className='mb-1 text-xs font-bold tracking-wider text-[#508a95] uppercase'>
            Total Invoices
          </p>
          <div className='flex items-baseline gap-2'>
            <h3 className='text-2xl font-extrabold text-[#0e181b] dark:text-white'>
              1,200
            </h3>
            <span className='flex items-center text-sm font-bold text-green-600 dark:text-green-400'>
              12%
              <TrendingUpIcon />
            </span>
          </div>
          <div className='mt-4 h-1 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800'>
            <div className='bg-primary h-full w-[75%] rounded-full'></div>
          </div>
        </section>
      </div>
    </div>
  )
}

export default CompanyShow
