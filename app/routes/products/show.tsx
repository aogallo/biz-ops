import { Link, useSubmit } from 'react-router'
import { Button } from '~/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card'
import { requireAuth } from '~/server/auth/session.server'
import { redirectWithFlash } from '~/server/flash.server'
import { PRODUCT_MESSAGES } from '../../features/products/messages'
import { deleteProduct } from '../../features/products/server/actions/delete.action'
import { productsRepository } from '../../features/products/server/repository'
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

  const product = await productsRepository.getBySku(organizationId, sku)

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

  // Get product to find ID
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

      <div className='grid gap-6 md:grid-cols-2'>
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
                    (product.stock ?? 0) === 0
                      ? 'text-destructive'
                      : (product.stock ?? 0) < 10
                        ? 'text-amber-600'
                        : 'text-green-600'
                  }
                >
                  {product.stock ?? 0}
                </span>
              </p>
              <p className='text-muted-foreground mt-1 text-sm'>
                {(product.stock ?? 0) === 0
                  ? 'Out of stock'
                  : (product.stock ?? 0) < 10
                    ? 'Low stock'
                    : 'In stock'}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className='md:col-span-2'>
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
