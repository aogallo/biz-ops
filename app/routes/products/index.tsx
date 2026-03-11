import type { ColumnDef } from '@tanstack/react-table'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { DataTable } from '~/components/dataTable/DataTable'
import { DataTableSearch } from '~/components/dataTable/DataTableSearch'
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
import { useTranslation } from '~/i18n/context'
import type { TranslationKey } from '~/i18n/types'
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
  const { t } = useTranslation()

  useToastFromLoader(toast)

  const handleExport = useCallback(async () => {
    const XLSX = await import('xlsx')
    const rows = products.map((p) => ({
      [t('products.sku')]: p.sku,
      [t('products.name')]: p.name,
      [t('products.category')]: p.categoryName || '-',
      [t('products.price')]: Number(p.price),
      [t('products.stock')]: p.stock ?? 0,
      [t('products.minStock')]: p.minStock ?? 0,
      [t('common.status' as TranslationKey)]:
        (p.stock ?? 0) === 0
          ? t('products.stockStatus.outOfStock')
          : (p.stock ?? 0) <= (p.minStock ?? 0) && (p.minStock ?? 0) > 0
            ? t('products.stockStatus.lowStock')
            : t('products.filter.normal'),
    }))
    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, t('products.title'))
    XLSX.writeFile(
      wb,
      `products-export-${new Date().toISOString().split('T')[0]}.xlsx`
    )
  }, [products, t])

  const currentCategoryId = searchParams.get('categoryId') || ''
  const currentStockStatus = searchParams.get('stockStatus') || ''
  const [searchInput, setSearchInput] = useState(
    searchParams.get('search') || ''
  )
  const isFirstRender = useRef(true)

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

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    const timer = setTimeout(() => {
      updateFilter('search', searchInput)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchInput])

  const columns = useMemo<ColumnDef<Product>[]>(
    () => [
      {
        accessorKey: 'sku',
        header: t('products.sku'),
        cell: ({ row }) => (
          <span className='font-mono text-sm'>{row.getValue('sku')}</span>
        ),
      },
      {
        accessorKey: 'name',
        header: t('common.name'),
        cell: ({ row }) => (
          <span className='font-medium'>{row.getValue('name')}</span>
        ),
      },
      {
        accessorKey: 'categoryName',
        header: t('products.category'),
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
        header: () => <div className='text-right'>{t('products.price')}</div>,
        cell: ({ row }) => {
          const price = row.getValue('price') as string | number
          return <div className='text-right'>${Number(price).toFixed(2)}</div>
        },
      },
      {
        accessorKey: 'stock',
        header: () => <div className='text-right'>{t('products.stock')}</div>,
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
                      ? 'font-medium text-amber-600'
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
            {t('common.view')}
          </Link>
        ),
      },
    ],
    [t]
  )

  if (noOrganization) {
    return (
      <div className='p-6'>
        <div className='rounded-lg border border-dashed p-8 text-center'>
          <p className='text-muted-foreground mb-4'>
            {t('messages.products.noOrganization' as TranslationKey)}
          </p>
          <Link to='/organization'>
            <Button>{t('sidebar.selectOrganization' as TranslationKey)}</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className='p-6'>
      <div className='mb-6 flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-bold'>{t('products.title')}</h1>
          <p className='text-muted-foreground'>
            {t('products.manage')}
            {total > 0 && <span className='ml-2 text-xs'>({total} total)</span>}
          </p>
        </div>
        <div className='flex gap-2'>
          {products.length > 0 && (
            <Button variant='outline' onClick={handleExport}>
              {t('products.export')}
            </Button>
          )}
          {canCreateProduct && (
            <Link to='/products/new'>
              <Button>{t('products.new')}</Button>
            </Link>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className='mb-4 flex flex-wrap gap-3'>
        <DataTableSearch
          value={searchInput}
          onChange={setSearchInput}
          placeholder={t('products.searchPlaceholder')}
        />

        <select
          value={currentCategoryId}
          onChange={(e) => updateFilter('categoryId', e.target.value)}
          className='border-input bg-background rounded-md border px-3 py-2 text-sm'
        >
          <option value=''>{t('common.allCategories')}</option>
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
          <option value=''>{t('products.allStockStatus')}</option>
          <option value='normal'>{t('products.filter.normal')}</option>
          <option value='low'>{t('products.filter.lowStock')}</option>
          <option value='out'>{t('products.filter.outOfStock')}</option>
        </select>
      </div>

      {products.length === 0 && !searchParams.toString() ? (
        <div className='rounded-lg border border-dashed p-8 text-center'>
          <p className='text-muted-foreground mb-4'>
            {t('products.noProducts')}
          </p>
          {canCreateProduct && (
            <Link to='/products/new'>
              <Button>{t('products.createTitle')}</Button>
            </Link>
          )}
        </div>
      ) : (
        <>
          <DataTable columns={columns} data={products} />

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
                {t('common.previous')}
              </Button>
              <span className='text-muted-foreground text-sm'>
                {t('common.pageOf' as TranslationKey, {
                  page: String(page),
                  total: String(totalPages),
                })}
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
                {t('common.next')}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
