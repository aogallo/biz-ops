import {
  Clock,
  FolderClosed,
  Hash,
  Info,
  Landmark,
  MapPinCheck,
} from 'lucide-react'
import { useNavigation } from 'react-router'
import { Button } from '~/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs'
import AccountHealthCard from '~/features/company/components/AccountHealthCard'
import BranchDistribution from '~/features/company/components/BranchDistribution'
import ContactCard from '~/features/company/components/ContactCard'
import LegalInformation from '~/features/company/components/LegalInformation'
import SkeletonStatCard from '~/features/company/components/SkeletonStatCard'
import StatCard from '~/features/company/components/StatCard'
import { getCompanyById } from '~/features/company/server/loaders'
import { requireAuth } from '~/server/auth/session.server'
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
  const navigation = useNavigation()
  return (
    <div className='flex-1 space-y-8 overflow-y-auto'>
      <div className='bg-card flex flex-col items-start justify-between gap-6 rounded-xl border p-8 shadow-sm md:flex-row md:items-end'>
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

      {/* Tabs */}
      <Tabs defaultValue='overview' className='w-full'>
        <TabsList>
          <TabsTrigger value='overview' className='gap-1.5'>
            <Info className='size-4' />
            Overview
          </TabsTrigger>
          <TabsTrigger value='financials' className='gap-1.5'>
            <Landmark className='size-4' />
            Financials
          </TabsTrigger>
          <TabsTrigger value='documents' className='gap-1.5'>
            <FolderClosed className='size-4' />
            Documents
          </TabsTrigger>
          <TabsTrigger value='activity' className='gap-1.5'>
            <Clock className='size-4' />
            Activity Log
          </TabsTrigger>
        </TabsList>

        <TabsContent value='overview' className='mt-6'>
          {/* Stats Grid */}
          {navigation.state === 'loading' ? (
            <SkeletonStatCard />
          ) : (
            <div className='space-y-8'>
              <div className='grid grid-cols-1 gap-4 md:grid-cols-4'>
                <StatCard
                  title='Total Invoices'
                  variant='default'
                  size='sm'
                  progress={10}
                  value={1200}
                />
                <StatCard
                  title='Cuentas por Pagar'
                  variant='purple'
                  size='sm'
                  value={999999}
                  trendDirection='down'
                />
                <StatCard
                  title='Cuentas por Cobrar'
                  variant='warning'
                  size='sm'
                  value={29291}
                  trendDirection='up'
                />
                <StatCard
                  title='Overdue Invoices'
                  variant='success'
                  size='sm'
                  progress={40}
                  isPercentage
                  value={12.1}
                />
              </div>

              {/* Two-column layout */}
              <div className='grid grid-cols-1 gap-8 lg:grid-cols-3'>
                {/* Left column - 2/3 width */}
                <div className='space-y-8 lg:col-span-2'>
                  <LegalInformation
                    company={{
                      name: company?.name,
                      nit: company?.nit,
                    }}
                  />
                  <ContactCard />
                </div>

                {/* Right column - 1/3 width */}
                <div className='space-y-6'>
                  <AccountHealthCard />
                  <BranchDistribution />
                </div>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value='financials' className='mt-6'>
          <div className='text-muted-foreground'>
            Financial information will be displayed here.
          </div>
        </TabsContent>

        <TabsContent value='documents' className='mt-6'>
          <div className='text-muted-foreground'>
            Documents will be displayed here.
          </div>
        </TabsContent>

        <TabsContent value='activity' className='mt-6'>
          <div className='text-muted-foreground'>
            Activity log will be displayed here.
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default CompanyShow
