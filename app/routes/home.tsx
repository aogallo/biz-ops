import { requireAuth } from '~/server/auth/session.server'
import type { Route } from './+types/home'
import UserInformation from '~/features/home/components/UserInformation'
import Modules from '~/features/home/components/Modules'
import QuickActions from '~/features/home/components/QuickActions'
import Pending from '~/features/home/components/Pending'
import RecentActivity from '~/features/home/components/RecentActivity'
import { getUserOrganizations } from '~/server/permissions'

export async function loader({ request }: Route.LoaderArgs) {
  const session = await requireAuth(request)
  const organizations = await getUserOrganizations(session.user.id)

  return {
    userName: session.user.name,
    companyName: organizations[0]?.name ?? '',
    // Static mock data for now — replace with real queries later
    overdueInvoices: 3,
    pendingPayables: 2,
    pendingPayablesDueDays: 3,
    activities: [
      {
        id: '1',
        icon: 'invoice' as const,
        title: 'Invoice #1023 created',
        subtitle: 'Operation completed successfully',
        time: '15 mins ago',
      },
      {
        id: '2',
        icon: 'payment' as const,
        title: 'Payment recorded to supplier',
        subtitle: 'Suministros Globales S.A.',
        time: '2 hours ago',
      },
      {
        id: '3',
        icon: 'client' as const,
        title: 'Client "Tech SA" added',
        subtitle: 'New corporate contact record',
        time: 'Yesterday',
      },
    ],
  }
}

export default function HomePage({ loaderData }: Route.ComponentProps) {
  const {
    userName,
    companyName,
    overdueInvoices,
    pendingPayables,
    pendingPayablesDueDays,
    activities,
  } = loaderData

  return (
    <div className='grid grid-cols-1 gap-6 lg:grid-cols-3'>
      {/* Left column */}
      <div className='space-y-6 lg:col-span-2'>
        <UserInformation userName={userName} companyName={companyName} />
        <Modules />
        <RecentActivity activities={activities} />
      </div>

      {/* Right column */}
      <div className='space-y-6'>
        <QuickActions />
        <Pending
          overdueInvoices={overdueInvoices}
          pendingPayables={pendingPayables}
          pendingPayablesDueDays={pendingPayablesDueDays}
        />
      </div>
    </div>
  )
}
