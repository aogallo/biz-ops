import { Link, useSubmit } from 'react-router'
import { ProductQRCode } from '~/features/products/components/ProductQRCode'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card'
import {
  categoryColorMap,
  type CategoryColor,
} from '~/features/categories/schemas'
import { PRODUCT_MESSAGES } from '~/features/products/messages'
import { deleteProduct } from '~/features/products/server/actions/delete.action'
import { productsRepository } from '~/features/products/server/repository'
import { requireAuth } from '~/server/auth/session.server'
import { redirectWithFlash } from '~/server/flash.server'
import type { Route } from './+types/show'

export async function loader({ request, params }: Route.LoaderArgs) {
  const session = await requireAuth(request)
  const { sku } = params

  const organizationId = session.session.activeOrganizationId
  if (!organizationId) {
    return redirectWithFlash('/products', {
      type: 'error',
      message: PRODUCT_MESSAGES.noOrganization,
    })
  }

  const product = await productsRepository.getBySkuWithCategory(
    organizationId,
    sku
  )

  if (!product) {
    return redirectWithFlash('/products', {
      type: 'error',
      message: PRODUCT_MESSAGES.notFound,
    })
  }

  return { product }
}

export async function action({ request, params }: Route.ActionArgs) {
  const { sku } = params
  const session = await requireAuth(request)
  const organizationId = session.session.activeOrganizationId

  if (!organizationId) {
    return { success: false, message: 'No active organization' }
  }

  const product = await productsRepository.getBySku(organizationId, sku)
  if (!product) {
    return { success: false, message: 'Product not found' }
  }

  const result = await deleteProduct(request, product.id)
  if (result.success) {
    return redirectWithFlash('/products', {
      type: 'success',
      message: PRODUCT_MESSAGES.deleted,
    })
  }
  return result
}

export default function ShowProduct({ loaderData }: Route.ComponentProps) {
  const { product } = loaderData
  const submit = useSubmit()

  const stock = product.stock ?? 0
  const minStock = product.minStock ?? 0
  const isLow = stock > 0 && stock <= minStock && minStock > 0
  const isOut = stock === 0

  const handleDelete = () => {
    if (
      confirm(
        `Are you sure you want to delete "${product.name}"? This action cannot be undone.`
      )
    ) {
      submit({}, { method: 'post' })
    }
  }

  return (
    <div className='p-6'>
      <div className='mb-6 flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-bold'>Product Details</h1>
          <p className='text-muted-foreground'>
            View and manage product information
          </p>
        </div>
        <div className='flex gap-2'>
          <Link to={`/products/${product.sku}/edit`}>
            <Button variant='outline'>Edit</Button>
          </Link>
          <Button variant='destructive' onClick={handleDelete}>
            Delete
          </Button>
          <Link to='/products'>
            <Button variant='outline'>Back to Products</Button>
          </Link>
        </div>
      </div>

      <div className='grid gap-6 md:grid-cols-3'>
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>
              Product identification and pricing
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div>
              <label className='text-muted-foreground text-sm font-medium'>
                SKU
              </label>
              <p className='font-mono text-lg'>{product.sku}</p>
            </div>
            <div>
              <label className='text-muted-foreground text-sm font-medium'>
                Product Name
              </label>
              <p className='text-lg font-semibold'>{product.name}</p>
            </div>
            <div>
              <label className='text-muted-foreground text-sm font-medium'>
                Price
              </label>
              <p className='text-primary text-2xl font-bold'>
                ${Number(product.price).toFixed(2)}
              </p>
            </div>
            {product.categoryName && product.categoryColor && (
              <div>
                <label className='text-muted-foreground text-sm font-medium'>
                  Category
                </label>
                <div className='mt-1'>
                  <Badge
                    variant='outline'
                    className={`${categoryColorMap[product.categoryColor as CategoryColor].bg} ${categoryColorMap[product.categoryColor as CategoryColor].text}`}
                  >
                    {product.categoryName}
                  </Badge>
                </div>
              </div>
            )}
            {product.description && (
              <div>
                <label className='text-muted-foreground text-sm font-medium'>
                  Description
                </label>
                <p className='text-sm'>{product.description}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Inventory</CardTitle>
            <CardDescription>Stock levels and availability</CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div>
              <label className='text-muted-foreground text-sm font-medium'>
                Current Stock
              </label>
              <p className='text-2xl font-bold'>
                <span
                  className={
                    isOut
                      ? 'text-destructive'
                      : isLow
                        ? 'text-amber-600'
                        : 'text-green-600'
                  }
                >
                  {stock}
                </span>
              </p>
              <p className='text-muted-foreground mt-1 text-sm'>
                {isOut ? 'Out of stock' : isLow ? 'Low stock' : 'In stock'}
              </p>
            </div>
            {minStock > 0 && (
              <div>
                <label className='text-muted-foreground text-sm font-medium'>
                  Minimum Stock Threshold
                </label>
                <p className='text-lg font-medium'>{minStock}</p>
                {stock > 0 && minStock > 0 && (
                  <div className='mt-2'>
                    <div className='bg-muted h-2 w-full overflow-hidden rounded-full'>
                      <div
                        className={`h-full rounded-full ${isOut ? 'bg-red-500' : isLow ? 'bg-amber-500' : 'bg-green-500'}`}
                        style={{
                          width: `${Math.min(100, (stock / minStock) * 100)}%`,
                        }}
                      />
                    </div>
                    <p className='text-muted-foreground mt-1 text-xs'>
                      {Math.round((stock / minStock) * 100)}% of minimum
                    </p>
                  </div>
                )}
              </div>
            )}
            {product.imageUrl && (
              <div>
                <label className='text-muted-foreground text-sm font-medium'>
                  Product Image
                </label>
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className='mt-2 max-h-48 rounded-md object-cover'
                />
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>QR Code</CardTitle>
            <CardDescription>Scan to access this product</CardDescription>
          </CardHeader>
          <CardContent>
            <ProductQRCode productName={product.name} sku={product.sku} />
          </CardContent>
        </Card>

        <Card className='md:col-span-3'>
          <CardHeader>
            <CardTitle>Metadata</CardTitle>
            <CardDescription>Tracking information</CardDescription>
          </CardHeader>
          <CardContent className='grid gap-4 md:grid-cols-3'>
            <div>
              <label className='text-muted-foreground text-sm font-medium'>
                Product ID
              </label>
              <p className='font-mono text-sm'>{product.id}</p>
            </div>
            <div>
              <label className='text-muted-foreground text-sm font-medium'>
                Created
              </label>
              <p className='text-sm'>
                {new Date(product.createdAt).toLocaleString()}
              </p>
            </div>
            <div>
              <label className='text-muted-foreground text-sm font-medium'>
                Last Updated
              </label>
              <p className='text-sm'>
                {new Date(product.updatedAt).toLocaleString()}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
