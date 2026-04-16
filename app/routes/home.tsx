import { requireAuth } from '~/server/auth/session.server'
import { getUserPermissions } from '~/server/auth/permissions.server'
import { getUserOrganizations, isSuperAdmin } from '~/server/permissions'
import type { Route } from './+types/home'
import UserInformation from '~/features/home/components/UserInformation'
import Modules from '~/features/home/components/Modules'
import QuickActions from '~/features/home/components/QuickActions'
import Pending from '~/features/home/components/Pending'
import RecentActivity from '~/features/home/components/RecentActivity'
import { getQuickActions } from '~/features/home/server/actions/get-quick-actions.action'
import { homeRepository } from '~/features/home/server/repository'

function formatRelativeTime(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / (1000 * 60))
  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins} min${diffMins !== 1 ? 's' : ''} ago`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24)
    return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`
  const diffDays = Math.floor(diffHours / 24)
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  return date.toLocaleDateString()
}

export async function loader({ request }: Route.LoaderArgs) {
  const session = await requireAuth(request)
  const userId = session.user.id
  const organizationId = session.session.activeOrganizationId

  const [organizations, quickActions] = await Promise.all([
    getUserOrganizations(userId),
    organizationId
      ? getQuickActions(userId, organizationId)
      : Promise.resolve([]),
  ])

  if (!organizationId) {
    return {
      userName: session.user.name,
      companyName: organizations[0]?.name ?? '',
      quickActions: [] as Awaited<ReturnType<typeof getQuickActions>>,
      overdueInvoices: null as number | null,
      pendingPayables: null as number | null,
      pendingPayablesDueDays: null as number | null,
      activities: [] as Array<{
        id: string
        icon: 'invoice' | 'payment' | 'client'
        title: string
        subtitle: string
        time: string
      }>,
      canViewDailyReport: false,
    }
  }

  const [superAdmin, permissions] = await Promise.all([
    isSuperAdmin(userId),
    getUserPermissions(userId, organizationId),
  ])

  const permSet = new Set(permissions)
  const can = (perm: string) => superAdmin || permSet.has(perm)

  const [
    overdueInvoices,
    pendingPayables,
    pendingPayablesDueDays,
    invoiceActivities,
    journalActivities,
    partnerActivities,
  ] = await Promise.all([
    can('invoices:view')
      ? homeRepository.getOverdueInvoicesCount(organizationId)
      : Promise.resolve(null),
    can('purchase:view')
      ? homeRepository.getPendingPayablesCount(organizationId)
      : Promise.resolve(null),
    can('purchase:view')
      ? homeRepository.getNextPendingPayableDueDays(organizationId)
      : Promise.resolve(null),
    can('invoices:view')
      ? homeRepository.getRecentInvoiceActivity(organizationId, 5)
      : Promise.resolve([]),
    can('journal-entries:view')
      ? homeRepository.getRecentJournalEntryActivity(organizationId, 5)
      : Promise.resolve([]),
    can('business-partners:view')
      ? homeRepository.getRecentBusinessPartnerActivity(organizationId, 5)
      : Promise.resolve([]),
  ])

  const activities = [
    ...invoiceActivities,
    ...journalActivities,
    ...partnerActivities,
  ]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 5)
    .map((activity) => ({
      id: activity.id,
      icon: activity.icon,
      title: activity.title,
      subtitle: activity.subtitle,
      time: formatRelativeTime(activity.createdAt),
    }))

  return {
    userName: session.user.name,
    companyName: organizations[0]?.name ?? '',
    quickActions,
    overdueInvoices,
    pendingPayables,
    pendingPayablesDueDays,
    activities,
    canViewDailyReport: can('reports:view'),
  }
}

export default function HomePage({ loaderData }: Route.ComponentProps) {
  const {
    userName,
    companyName,
    quickActions,
    overdueInvoices,
    pendingPayables,
    pendingPayablesDueDays,
    activities,
    canViewDailyReport,
  } = loaderData

  const hasPendingData = overdueInvoices !== null || pendingPayables !== null

  return (
    <div className='grid grid-cols-1 gap-6 lg:grid-cols-3'>
      {/* Left column */}
      <div className='space-y-6 lg:col-span-2'>
        <UserInformation
          userName={userName}
          companyName={companyName}
          canViewDailyReport={canViewDailyReport}
        />
        <Modules />
        <RecentActivity activities={activities} />
      </div>

      {/* Right column */}
      <div className='space-y-6'>
        <QuickActions actions={quickActions} />
        {hasPendingData && (
          <Pending
            overdueInvoices={overdueInvoices}
            pendingPayables={pendingPayables}
            pendingPayablesDueDays={pendingPayablesDueDays}
          />
        )}
      </div>
    </div>
  )
}
