import { count, eq } from 'drizzle-orm'
import { db } from '~/server/db'
import { memberModel } from '~/server/db/schemas/auth'
import AccountingSummary from '~/features/dashboard/components/AccountingSummary'
import AppointmentSummary from '~/features/dashboard/components/AppointmentSummary'
import Greetings from '~/features/dashboard/components/Greetings'
import InventorySummary from '~/features/dashboard/components/InventorySummary'
import { dashboardStatsRepository } from '~/features/dashboard/server/repository'
import { requireAuth } from '~/server/auth/session.server'
import type { Route } from './+types/index'

export async function loader({ request }: Route.LoaderArgs) {
  const session = await requireAuth(request)
  const organizationId = session.session.activeOrganizationId

  if (!organizationId) {
    return {
      todayAppointments: [],
      nextAppointment: null,
      monthlyStats: { total: 0, completed: 0, cancelled: 0, revenue: 0 },
      occupancyRate: 0,
      todayDate: new Date().toISOString().split('T')[0],
      inventoryStats: { totalProducts: 0, totalStockValue: 0, lowStockCount: 0, outOfStockCount: 0 },
      lowStockProducts: [],
      recentMovements: [],
    }
  }

  const now = new Date()
  const today = now.toISOString().split('T')[0]
  const currentTime = now.toTimeString().slice(0, 5) // HH:mm
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    .toISOString()
    .split('T')[0]

  // Get staff count for occupancy calculation
  const [staffCountResult] = await db
    .select({ count: count() })
    .from(memberModel)
    .where(eq(memberModel.organizationId, organizationId))

  const staffCount = staffCountResult?.count ?? 1

  const [
    todayAppointments,
    nextAppointment,
    monthlyStats,
    occupancyRate,
    inventoryStats,
    lowStockProducts,
    recentMovements,
  ] = await Promise.all([
    dashboardStatsRepository.getTodayAppointments(organizationId, today),
    dashboardStatsRepository.getNextAppointment(organizationId, today, currentTime),
    dashboardStatsRepository.getMonthlyStats(organizationId, monthStart, monthEnd),
    dashboardStatsRepository.getOccupancyRate(organizationId, monthStart, monthEnd, staffCount),
    dashboardStatsRepository.getInventoryStats(organizationId),
    dashboardStatsRepository.getLowStockProducts(organizationId),
    dashboardStatsRepository.getRecentMovements(organizationId),
  ])

  return {
    todayAppointments,
    nextAppointment,
    monthlyStats,
    occupancyRate,
    todayDate: today,
    inventoryStats,
    lowStockProducts,
    recentMovements,
  }
}

export default function Dashboard({ loaderData }: Route.ComponentProps) {
  const {
    todayAppointments,
    nextAppointment,
    monthlyStats,
    occupancyRate,
    todayDate,
    inventoryStats,
    lowStockProducts,
    recentMovements,
  } = loaderData

  return (
    <div className='dark:bg-background-dark/50 flex-1 space-y-5 overflow-y-auto'>
      <Greetings />
      <div className='grid grid-cols-12 gap-6'>
        <AccountingSummary />
        <AppointmentSummary
          todayAppointments={todayAppointments}
          nextAppointment={nextAppointment}
          todayDate={todayDate}
          monthlyRevenue={monthlyStats.revenue}
          occupancyRate={occupancyRate}
        />
        <InventorySummary
          stats={inventoryStats}
          lowStockProducts={lowStockProducts}
          recentMovements={recentMovements}
        />
      </div>
    </div>
  )
}
