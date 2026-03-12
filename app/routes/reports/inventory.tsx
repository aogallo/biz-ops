import { useSearchParams } from 'react-router'
import { Button } from '~/components/ui/button'
import { MovementTrendsChart } from '~/features/inventory-reports/components/MovementTrendsChart'
import { StockValueChart } from '~/features/inventory-reports/components/StockValueChart'
import { TopProductsChart } from '~/features/inventory-reports/components/TopProductsChart'
import { inventoryReportsRepository } from '~/features/inventory-reports/server/repository'
import { requireAuth } from '~/server/auth/session.server'
import type { Route } from './+types/inventory'

export async function loader({ request }: Route.LoaderArgs) {
  const session = await requireAuth(request)
  const organizationId = session.session.activeOrganizationId

  if (!organizationId) {
    return {
      stockByCategory: [],
      movementTrends: [],
      topProducts: [],
    }
  }

  const url = new URL(request.url)
  const now = new Date()

  // Default: last 30 days
  const dateFrom =
    url.searchParams.get('dateFrom') ||
    new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30)
      .toISOString()
      .split('T')[0]
  const dateTo =
    url.searchParams.get('dateTo') || now.toISOString().split('T')[0]

  const [stockByCategory, movementTrends, topProducts] = await Promise.all([
    inventoryReportsRepository.getStockValueByCategory(organizationId),
    inventoryReportsRepository.getMovementTrends(
      organizationId,
      dateFrom,
      dateTo
    ),
    inventoryReportsRepository.getTopMovedProducts(organizationId),
  ])

  return {
    stockByCategory,
    movementTrends,
    topProducts,
    dateFrom,
    dateTo,
  }
}

export default function InventoryReport({ loaderData }: Route.ComponentProps) {
  const { stockByCategory, movementTrends, topProducts } = loaderData
  const [searchParams, setSearchParams] = useSearchParams()

  const dateFrom = searchParams.get('dateFrom') || loaderData.dateFrom
  const dateTo = searchParams.get('dateTo') || loaderData.dateTo

  const updateDateRange = (from: string, to: string) => {
    const params = new URLSearchParams(searchParams)
    params.set('dateFrom', from)
    params.set('dateTo', to)
    setSearchParams(params)
  }

  // Quick range presets
  const setLastDays = (days: number) => {
    const now = new Date()
    const from = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() - days
    )
    updateDateRange(
      from.toISOString().split('T')[0],
      now.toISOString().split('T')[0]
    )
  }

  return (
    <div className='space-y-6 p-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-bold'>Inventory Report</h1>
          <p className='text-muted-foreground'>
            Stock value, movement trends, and product activity
          </p>
        </div>
      </div>

      {/* Date range filters */}
      <div className='flex flex-wrap items-center gap-3'>
        <div className='flex items-center gap-2'>
          <label className='text-sm font-medium'>From</label>
          <input
            type='date'
            value={dateFrom}
            onChange={(e) => updateDateRange(e.target.value, dateTo || '')}
            className='border-input bg-background rounded-md border px-3 py-1.5 text-sm'
          />
        </div>
        <div className='flex items-center gap-2'>
          <label className='text-sm font-medium'>To</label>
          <input
            type='date'
            value={dateTo}
            onChange={(e) => updateDateRange(dateFrom || '', e.target.value)}
            className='border-input bg-background rounded-md border px-3 py-1.5 text-sm'
          />
        </div>
        <div className='flex gap-1'>
          <Button variant='outline' size='sm' onClick={() => setLastDays(7)}>
            7d
          </Button>
          <Button variant='outline' size='sm' onClick={() => setLastDays(30)}>
            30d
          </Button>
          <Button variant='outline' size='sm' onClick={() => setLastDays(90)}>
            90d
          </Button>
        </div>
      </div>

      {/* Charts grid */}
      <div className='grid gap-6 lg:grid-cols-2'>
        <StockValueChart data={stockByCategory} />
        <TopProductsChart data={topProducts} />
      </div>

      <MovementTrendsChart data={movementTrends} />
    </div>
  )
}
