import { Link, useSearchParams } from 'react-router'
import { Plus } from 'lucide-react'
import { Button } from '~/components/ui/button'
import { DataTable } from '~/components/dataTable/DataTable'
import TitleAndActions from '~/components/TitleAndActions'
import TitleAndActionsBody from '~/components/TitleAndActionsBody'
import {
  orderColumns,
  type OrderRow,
} from '~/features/orders/components/columns'
import { ordersRepository } from '~/features/orders/server/repository'
import { requireAuth } from '~/server/auth/session.server'
import { useCanPerformAction } from '~/hooks/usePermissions'
import type { Route } from './+types/index'

export async function loader({ request }: Route.LoaderArgs) {
  const session = await requireAuth(request)
  const organizationId = session.session.activeOrganizationId

  if (!organizationId) {
    return { orders: [], total: 0, page: 1, pageSize: 10, totalPages: 0 }
  }

  const url = new URL(request.url)
  const page = Number(url.searchParams.get('page') ?? '1')
  const pageSize = Number(url.searchParams.get('pageSize') ?? '10')
  const status = url.searchParams.get('status') ?? undefined
  const search = url.searchParams.get('search') ?? undefined

  const result = await ordersRepository.getFiltered(
    organizationId,
    { status, search },
    { page, pageSize }
  )

  return result
}

export default function OrdersIndex({ loaderData }: Route.ComponentProps) {
  const { orders } = loaderData
  const [searchParams, setSearchParams] = useSearchParams()
  const canCreateOrder = useCanPerformAction('orders.create')

  const statusFilter = searchParams.get('status') ?? ''

  return (
    <div className='p-6'>
      <TitleAndActions title='Orders'>
        <TitleAndActionsBody>
          <select
            value={statusFilter}
            onChange={(e) => {
              const params = new URLSearchParams(searchParams)
              if (e.target.value) {
                params.set('status', e.target.value)
              } else {
                params.delete('status')
              }
              params.set('page', '1')
              setSearchParams(params)
            }}
            className='border-input bg-background rounded-md border px-3 py-2 text-sm'
          >
            <option value=''>All Status</option>
            <option value='DRAFT'>Draft</option>
            <option value='CONFIRMED'>Confirmed</option>
            <option value='COMPLETED'>Completed</option>
            <option value='CANCELLED'>Cancelled</option>
          </select>
          {canCreateOrder && (
            <Link to='/purchase/orders/new'>
              <Button>
                <Plus className='mr-2 h-4 w-4' />
                New Order
              </Button>
            </Link>
          )}
        </TitleAndActionsBody>
      </TitleAndActions>

      <DataTable
        columns={orderColumns}
        data={orders as OrderRow[]}
        enableSearch
        searchPlaceholder='Search orders...'
      />
    </div>
  )
}
