import type { ColumnDef } from '@tanstack/react-table'
import { useCallback, useMemo } from 'react'
import { Link, useSearchParams } from 'react-router'
import { DataTable } from '~/components/dataTable/DataTable'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import {
  categoryColorMap,
  type CategoryColor,
} from '~/features/categories/schemas'
import { categoriesRepository } from '~/features/categories/server/repository'
import {
  productsRepository,
  type ProductFilters,
} from '~/features/products/server/repository'
import { useCanPerformAction } from '~/hooks/usePermissions'
import { useToastFromLoader } from '~/hooks/useToastFromLoader'
import { requireAuth } from '~/server/auth/session.server'
import { getFlash } from '~/server/flash.server'
import type { Route } from './+types/index'

type Product = Awaited<
  ReturnType<typeof productsRepository.getFiltered>
>['products'][number]

export async function loader({ request }: Route.LoaderArgs) {
  const session = await requireAuth(request)
  const { flash } = getFlash(request)

  const organizationId = session.session.activeOrganizationId
  if (!organizationId) {
    return {
      products: [],
      categories: [],
      total: 0,
      page: 1,
      pageSize: 10,
      totalPages: 0,
      noOrganization: true,
      toast: flash,
    }
  }

  const url = new URL(request.url)
  const search = url.searchParams.get('search') || undefined
  const categoryId = url.searchParams.get('categoryId') || undefined
  const stockStatus = url.searchParams.get('stockStatus') as
    | ProductFilters['stockStatus']
    | undefined
  const page = Math.max(1, Number(url.searchParams.get('page')) || 1)
  const pageSize = 10

  const [result, categories] = await Promise.all([
    productsRepository.getFiltered(
      organizationId,
      { search, categoryId, stockStatus },
      { page, pageSize }
    ),
    categoriesRepository.getAllByOrganization(organizationId),
  ])

  return {
    ...result,
    categories,
    noOrganization: false,
    toast: flash,
  }
}

export default function ProductsIndex({ loaderData }: Route.ComponentProps) {
  const {
    products,
    categories,
    total,
    page,
    totalPages,
    noOrganization,
    toast,
  } = loaderData
  const canCreateProduct = useCanPerformAction('products.create')
  const [searchParams, setSearchParams] = useSearchParams()

  useToastFromLoader(toast)

  const handleExport = useCallback(async () => {
    const XLSX = await import('xlsx')
    const rows = products.map((p) => ({
      SKU: p.sku,
      Name: p.name,
      Category: p.categoryName || '-',
      Price: Number(p.price),
      Stock: p.stock ?? 0,
      'Min Stock': p.minStock ?? 0,
      Status:
        (p.stock ?? 0) === 0
          ? 'Out of Stock'
          : (p.stock ?? 0) <= (p.minStock ?? 0) && (p.minStock ?? 0) > 0
            ? 'Low Stock'
            : 'Normal',
    }))
    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Products')
    XLSX.writeFile(wb, `products-export-${new Date().toISOString().split('T')[0]}.xlsx`)
  }, [products])

  const currentCategoryId = searchParams.get('categoryId') || ''
  const currentStockStatus = searchParams.get('stockStatus') || ''

  const updateFilter = (key: string, value: string) => {
    const newParams = new URLSearchParams(searchParams)
    if (value) {
      newParams.set(key, value)
    } else {
      newParams.delete(key)
    }
    newParams.delete('page') // Reset to page 1 on filter change
    setSearchParams(newParams)
  }

  const columns = useMemo<ColumnDef<Product>[]>(
    () => [
      {
        accessorKey: 'sku',
        header: 'SKU',
        cell: ({ row }) => (
          <span className='font-mono text-sm'>{row.getValue('sku')}</span>
        ),
      },
      {
        accessorKey: 'name',
        header: 'Name',
        cell: ({ row }) => (
          <span className='font-medium'>{row.getValue('name')}</span>
        ),
      },
      {
        accessorKey: 'categoryName',
        header: 'Category',
        cell: ({ row }) => {
          const name = row.original.categoryName
          const color = row.original.categoryColor as CategoryColor | null
          if (!name || !color) {
            return <span className='text-muted-foreground'>-</span>
          }
          const colorStyles = categoryColorMap[color]
          return (
            <Badge
              variant='outline'
              className={`${colorStyles.bg} ${colorStyles.text}`}
            >
              {name}
            </Badge>
          )
        },
      },
      {
        accessorKey: 'price',
        header: () => <div className='text-right'>Price</div>,
        cell: ({ row }) => {
          const price = row.getValue('price') as string | number
          return (
            <div className='text-right'>${Number(price).toFixed(2)}</div>
          )
        },
      },
      {
        accessorKey: 'stock',
        header: () => <div className='text-right'>Stock</div>,
        cell: ({ row }) => {
          const stock = (row.getValue('stock') as number | null) ?? 0
          const minStock = row.original.minStock ?? 0
          const isLow = stock > 0 && stock <= minStock && minStock > 0
          const isOut = stock === 0

          return (
            <div className='text-right'>
              <span
                className={
                  isOut
                    ? 'text-destructive font-medium'
                    : isLow
                      ? 'text-amber-600 font-medium'
                      : 'text-green-600'
                }
              >
                {stock}
              </span>
              {minStock > 0 && (
                <span className='text-muted-foreground ml-1 text-xs'>
                  / {minStock}
                </span>
              )}
            </div>
          )
        },
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <Link
            to={`/products/${row.original.sku}`}
            className='text-primary text-sm font-medium hover:underline'
          >
            View
          </Link>
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
            Please select an organization to view products.
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
          <h1 className='text-2xl font-bold'>Products</h1>
          <p className='text-muted-foreground'>
            Manage your product catalog and inventory
            {total > 0 && (
              <span className='ml-2 text-xs'>({total} total)</span>
            )}
          </p>
        </div>
        <div className='flex gap-2'>
          {products.length > 0 && (
            <Button variant='outline' onClick={handleExport}>
              Export
            </Button>
          )}
          {canCreateProduct && (
            <Link to='/products/new'>
              <Button>Add Product</Button>
            </Link>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className='mb-4 flex flex-wrap gap-3'>
        <select
          value={currentCategoryId}
          onChange={(e) => updateFilter('categoryId', e.target.value)}
          className='border-input bg-background rounded-md border px-3 py-2 text-sm'
        >
          <option value=''>All Categories</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>

        <select
          value={currentStockStatus}
          onChange={(e) => updateFilter('stockStatus', e.target.value)}
          className='border-input bg-background rounded-md border px-3 py-2 text-sm'
        >
          <option value=''>All Stock Status</option>
          <option value='normal'>Normal</option>
          <option value='low'>Low Stock</option>
          <option value='out'>Out of Stock</option>
        </select>
      </div>

      {products.length === 0 && !searchParams.toString() ? (
        <div className='rounded-lg border border-dashed p-8 text-center'>
          <p className='text-muted-foreground mb-4'>
            No products found. Create your first product to get started.
          </p>
          {canCreateProduct && (
            <Link to='/products/new'>
              <Button>Create Product</Button>
            </Link>
          )}
        </div>
      ) : (
        <>
          <DataTable
            columns={columns}
            data={products}
            enableSearch
            searchPlaceholder='Search products...'
          />

          {/* Server-side pagination */}
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
