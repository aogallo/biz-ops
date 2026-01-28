import type { ColumnDef } from '@tanstack/react-table'
import { useMemo } from 'react'
import { Link } from 'react-router'
import { DataTable } from '~/components/dataTable/DataTable'
import { Button } from '~/components/ui/button'
import { productsRepository } from '~/features/products/server/repository'
import { useCanPerformAction } from '~/hooks/usePermissions'
import { useToastFromLoader } from '~/hooks/useToastFromLoader'
import { requireAuth } from '~/server/auth/session.server'
import { getFlash } from '~/server/flash.server'
import type { Route } from './+types/index'

type Product = Awaited<
  ReturnType<typeof productsRepository.getAllByOrganization>
>[number]

export async function loader({ request }: Route.LoaderArgs) {
  const session = await requireAuth(request)

  // Get flash message and headers to clear it
  const { flash } = getFlash(request)

  const organizationId = session.session.activeOrganizationId
  if (!organizationId) {
    return {
      products: [],
      noOrganization: true,
      toast: flash,
    }
  }

  const products = await productsRepository.getAllByOrganization(organizationId)

  return {
    products,
    noOrganization: false,
    toast: flash,
  }
}

export default function ProductsIndex({ loaderData }: Route.ComponentProps) {
  const { products, noOrganization, toast } = loaderData
  const canCreateProduct = useCanPerformAction('products.create')

  // Show toast if present in loader data
  useToastFromLoader(toast)

  const columns = useMemo<ColumnDef<Product>[]>(
    () => [
      {
        accessorKey: 'sku',
        header: 'SKU',
        cell: ({ row }) => (
          <span className="font-mono text-sm">{row.getValue('sku')}</span>
        ),
      },
      {
        accessorKey: 'name',
        header: 'Name',
        cell: ({ row }) => (
          <span className="font-medium">{row.getValue('name')}</span>
        ),
      },
      {
        accessorKey: 'price',
        header: () => <div className="text-right">Price</div>,
        cell: ({ row }) => {
          const price = row.getValue('price') as string | number
          return (
            <div className="text-right">${Number(price).toFixed(2)}</div>
          )
        },
      },
      {
        accessorKey: 'stock',
        header: () => <div className="text-right">Stock</div>,
        cell: ({ row }) => {
          const stock = (row.getValue('stock') as number | null) ?? 0
          return (
            <div className="text-right">
              <span
                className={
                  stock === 0
                    ? 'text-destructive'
                    : stock < 10
                      ? 'text-amber-600'
                      : 'text-green-600'
                }
              >
                {stock}
              </span>
            </div>
          )
        },
      },
      {
        accessorKey: 'createdAt',
        header: 'Created',
        cell: ({ row }) => {
          const date = row.getValue('createdAt') as Date
          return <div>{new Date(date).toLocaleDateString()}</div>
        },
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <Link
            to={`/products/${row.original.sku}`}
            className="text-primary text-sm font-medium hover:underline"
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
          </p>
        </div>
        {canCreateProduct && (
          <Link to='/products/new'>
            <Button>Add Product</Button>
          </Link>
        )}
      </div>

      {products.length === 0 ? (
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
        <DataTable
          columns={columns}
          data={products}
          enableSearch
          searchPlaceholder="Search products..."
        />
      )}
    </div>
  )
}
