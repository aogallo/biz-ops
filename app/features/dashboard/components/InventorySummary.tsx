import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Package,
  TrendingDown,
} from 'lucide-react'
import { Link } from 'react-router'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'

interface InventoryStats {
  totalProducts: number
  totalStockValue: number
  lowStockCount: number
  outOfStockCount: number
}

interface LowStockProduct {
  id: string
  name: string
  sku: string
  stock: number | null
  minStock: number | null
}

interface RecentMovement {
  id: string
  type: string
  quantity: number
  reason: string
  movementDate: Date
  productName: string
  productSku: string
}

interface Props {
  stats: InventoryStats
  lowStockProducts: LowStockProduct[]
  recentMovements: RecentMovement[]
}

const InventorySummary = ({
  stats,
  lowStockProducts,
  recentMovements,
}: Props) => {
  const hasAlerts = stats.lowStockCount > 0 || stats.outOfStockCount > 0

  return (
    <section className='bg-card shadow-card col-span-12 overflow-hidden rounded-xl lg:col-span-4'>
      {/* Header */}
      <div className='border-border/30 border-b p-5'>
        <h3 className='text-section-header accent-inventory flex items-center gap-2'>
          <Package className='size-5' />
          Inventory
        </h3>
      </div>

      <div className='space-y-4 p-5'>
        {/* Stats grid */}
        <div className='grid grid-cols-2 gap-3'>
          <div className='bg-muted/50 rounded-lg p-3'>
            <p className='text-muted-foreground text-xs'>Products</p>
            <p className='text-lg font-semibold'>{stats.totalProducts}</p>
          </div>
          <div className='bg-muted/50 rounded-lg p-3'>
            <p className='text-muted-foreground text-xs'>Stock Value</p>
            <p className='text-lg font-semibold'>
              Q
              {stats.totalStockValue.toLocaleString('en', {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              })}
            </p>
          </div>
        </div>

        {/* Alerts */}
        {hasAlerts && (
          <div className='space-y-2'>
            {stats.outOfStockCount > 0 && (
              <div className='flex items-center gap-2 rounded-md bg-red-50 px-3 py-2 text-sm dark:bg-red-950/30'>
                <AlertTriangle className='size-4 text-red-500' />
                <span className='text-red-700 dark:text-red-400'>
                  {stats.outOfStockCount} product
                  {stats.outOfStockCount !== 1 ? 's' : ''} out of stock
                </span>
              </div>
            )}
            {stats.lowStockCount > 0 && (
              <div className='flex items-center gap-2 rounded-md bg-amber-50 px-3 py-2 text-sm dark:bg-amber-950/30'>
                <TrendingDown className='size-4 text-amber-500' />
                <span className='text-amber-700 dark:text-amber-400'>
                  {stats.lowStockCount} product
                  {stats.lowStockCount !== 1 ? 's' : ''} low stock
                </span>
              </div>
            )}
          </div>
        )}

        {/* Low stock products */}
        {lowStockProducts.length > 0 && (
          <div className='space-y-2'>
            <p className='text-muted-foreground text-xs font-medium uppercase'>
              Low Stock Items
            </p>
            {lowStockProducts.map((product) => {
              const stock = product.stock ?? 0
              const minStock = product.minStock ?? 1
              const ratio = Math.min((stock / minStock) * 100, 100)
              const isOut = stock === 0

              return (
                <div key={product.id} className='space-y-1'>
                  <div className='flex items-center justify-between'>
                    <p className='truncate text-sm font-medium'>
                      {product.name}
                    </p>
                    <Badge
                      variant='outline'
                      className={
                        isOut
                          ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400'
                          : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400'
                      }
                    >
                      {isOut ? 'Out' : `${stock}/${minStock}`}
                    </Badge>
                  </div>
                  <div className='bg-muted h-1.5 w-full overflow-hidden rounded-full'>
                    <div
                      className={`h-full rounded-full ${isOut ? 'bg-red-500' : ratio <= 30 ? 'bg-red-500' : 'bg-amber-500'}`}
                      style={{ width: `${Math.max(ratio, 3)}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Recent movements */}
        {recentMovements.length > 0 && (
          <div className='space-y-2'>
            <p className='text-muted-foreground text-xs font-medium uppercase'>
              Recent Activity
            </p>
            {recentMovements.slice(0, 3).map((m) => (
              <div key={m.id} className='flex items-center gap-2 text-sm'>
                {m.type === 'entry' ? (
                  <ArrowDownRight className='size-3.5 text-green-500' />
                ) : m.type === 'exit' ? (
                  <ArrowUpRight className='size-3.5 text-red-500' />
                ) : (
                  <Package className='size-3.5 text-blue-500' />
                )}
                <span className='text-muted-foreground flex-1 truncate'>
                  {m.productName}
                </span>
                <span className='font-mono text-xs'>
                  {m.type === 'entry' ? '+' : m.type === 'exit' ? '-' : '~'}
                  {m.quantity}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* No data state */}
        {stats.totalProducts === 0 && (
          <p className='text-muted-foreground py-4 text-center text-sm'>
            No products yet. Add your first product to track inventory.
          </p>
        )}

        {/* Action buttons */}
        <div className='flex gap-2'>
          <Button asChild variant='outline' size='sm' className='flex-1'>
            <Link to='/products'>Products</Link>
          </Button>
          <Button asChild size='sm' className='flex-1'>
            <Link to='/stock'>Stock</Link>
          </Button>
        </div>
      </div>
    </section>
  )
}

export default InventorySummary
