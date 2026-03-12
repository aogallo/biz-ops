import type { ColumnDef } from '@tanstack/react-table'
import { useMemo } from 'react'
import { Link, useSearchParams } from 'react-router'
import { DataTable } from '~/components/dataTable/DataTable'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import {
  stockMovementRepository,
  type StockMovementFilters,
} from '~/features/stock/server/repository'
import { productsRepository } from '~/features/products/server/repository'
import { requireAuth } from '~/server/auth/session.server'
import type { Route } from './+types/index'

type Movement = Awaited<
  ReturnType<typeof stockMovementRepository.getByOrganization>
>['movements'][number]

export async function loader({ request }: Route.LoaderArgs) {
  const session = await requireAuth(request)
  const organizationId = session.session.activeOrganizationId

  if (!organizationId) {
    return {
      movements: [],
      products: [],
      total: 0,
      page: 1,
      totalPages: 0,
      noOrganization: true,
    }
  }

  const url = new URL(request.url)
  const productId = url.searchParams.get('productId') || undefined
  const type = url.searchParams.get('type') as
    | StockMovementFilters['type']
    | undefined
  const dateFrom = url.searchParams.get('dateFrom') || undefined
  const dateTo = url.searchParams.get('dateTo') || undefined
  const page = Math.max(1, Number(url.searchParams.get('page')) || 1)

  const [result, products] = await Promise.all([
    stockMovementRepository.getByOrganization(
      organizationId,
      { productId, type, dateFrom, dateTo },
      page
    ),
    productsRepository.getAllByOrganization(organizationId),
  ])

  return {
    ...result,
    products,
    noOrganization: false,
  }
}

const typeStyles = {
  entry: {
    label: 'Entry',
    variant: 'default' as const,
    color: 'bg-green-100 text-green-700',
  },
  exit: {
    label: 'Exit',
    variant: 'destructive' as const,
    color: 'bg-red-100 text-red-700',
  },
  adjustment: {
    label: 'Adjustment',
    variant: 'secondary' as const,
    color: 'bg-blue-100 text-blue-700',
  },
}

export default function StockMovementsIndex({
  loaderData,
}: Route.ComponentProps) {
  const { movements, products, total, page, totalPages, noOrganization } =
    loaderData
  const [searchParams, setSearchParams] = useSearchParams()

  const currentProductId = searchParams.get('productId') || ''
  const currentType = searchParams.get('type') || ''

  const updateFilter = (key: string, value: string) => {
    const newParams = new URLSearchParams(searchParams)
    if (value) {
      newParams.set(key, value)
    } else {
      newParams.delete(key)
    }
    newParams.delete('page')
    setSearchParams(newParams)
  }

  const columns = useMemo<ColumnDef<Movement>[]>(
    () => [
      {
        accessorKey: 'movementDate',
        header: 'Date',
        cell: ({ row }) => {
          const date = row.getValue('movementDate') as Date
          return (
            <span className='text-sm'>
              {new Date(date).toLocaleDateString()}
            </span>
          )
        },
      },
      {
        accessorKey: 'type',
        header: 'Type',
        cell: ({ row }) => {
          const type = row.getValue('type') as keyof typeof typeStyles
          const style = typeStyles[type]
          return (
            <Badge variant='outline' className={style.color}>
              {style.label}
            </Badge>
          )
        },
      },
      {
        accessorKey: 'productName',
        header: 'Product',
        cell: ({ row }) => (
          <div>
            <span className='font-medium'>{row.original.productName}</span>
            <span className='text-muted-foreground ml-2 text-xs'>
              {row.original.productSku}
            </span>
          </div>
        ),
      },
      {
        accessorKey: 'quantity',
        header: () => <div className='text-right'>Qty</div>,
        cell: ({ row }) => {
          const type = row.original.type
          const qty = row.getValue('quantity') as number
          return (
            <div className='text-right font-mono'>
              <span
                className={
                  type === 'entry'
                    ? 'text-green-600'
                    : type === 'exit'
                      ? 'text-red-600'
                      : 'text-blue-600'
                }
              >
                {type === 'entry' ? '+' : type === 'exit' ? '-' : '~'}
                {qty}
              </span>
            </div>
          )
        },
      },
      {
        accessorKey: 'reason',
        header: 'Reason',
        cell: ({ row }) => (
          <span className='text-sm'>{row.getValue('reason')}</span>
        ),
      },
      {
        accessorKey: 'createdByName',
        header: 'By',
        cell: ({ row }) => (
          <span className='text-muted-foreground text-sm'>
            {row.getValue('createdByName') || '-'}
          </span>
        ),
      },
    ],
    []
  )

  if (noOrganization) {
    return (
      <div className='p-6'>
        <div className='rounded-lg border border-dashed p-8 text-center'>
          <p className='text-muted-foreground mb-4'>
            Please select an organization to view stock movements.
          </p>
          <Link to='/organization'>
            <Button>Select Organization</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className='p-6'>
      <div className='mb-6 flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-bold'>Stock Movements</h1>
          <p className='text-muted-foreground'>
            Track all inventory entries, exits, and adjustments
            {total > 0 && <span className='ml-2 text-xs'>({total} total)</span>}
          </p>
        </div>
        <Link to='/stock/new'>
          <Button>New Movement</Button>
        </Link>
      </div>

      {/* Filters */}
      <div className='mb-4 flex flex-wrap gap-3'>
        <select
          value={currentProductId}
          onChange={(e) => updateFilter('productId', e.target.value)}
          className='border-input bg-background rounded-md border px-3 py-2 text-sm'
        >
          <option value=''>All Products</option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} ({p.sku})
            </option>
          ))}
        </select>

        <select
          value={currentType}
          onChange={(e) => updateFilter('type', e.target.value)}
          className='border-input bg-background rounded-md border px-3 py-2 text-sm'
        >
          <option value=''>All Types</option>
          <option value='entry'>Entry</option>
          <option value='exit'>Exit</option>
          <option value='adjustment'>Adjustment</option>
        </select>
      </div>

      {movements.length === 0 ? (
        <div className='rounded-lg border border-dashed p-8 text-center'>
          <p className='text-muted-foreground mb-4'>
            No stock movements found. Record your first movement.
          </p>
          <Link to='/stock/new'>
            <Button>New Movement</Button>
          </Link>
        </div>
      ) : (
        <>
          <DataTable
            columns={columns}
            data={movements}
            enableSearch
            searchPlaceholder='Search movements...'
          />

          {totalPages > 1 && (
            <div className='mt-4 flex items-center justify-center gap-2'>
              <Button
                variant='outline'
                size='sm'
                disabled={page <= 1}
                onClick={() => {
                  const params = new URLSearchParams(searchParams)
                  params.set('page', String(page - 1))
                  setSearchParams(params)
                }}
              >
                Previous
              </Button>
              <span className='text-muted-foreground text-sm'>
                Page {page} of {totalPages}
              </span>
              <Button
                variant='outline'
                size='sm'
                disabled={page >= totalPages}
                onClick={() => {
                  const params = new URLSearchParams(searchParams)
                  params.set('page', String(page + 1))
                  setSearchParams(params)
                }}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
