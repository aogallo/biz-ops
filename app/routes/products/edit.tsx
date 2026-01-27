import { Form, redirect, useActionData, useNavigation } from 'react-router'
import { Button } from '~/components/ui/button'
import { requireAuth } from '~/server/auth/session.server'
import { redirectWithFlash } from '~/server/flash.server'
import { PRODUCT_MESSAGES } from '../../features/products/messages'
import { updateProduct } from '../../features/products/server/actions/update.action'
import { productsRepository } from '../../features/products/server/repository'
import type { Route } from './+types/edit'

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

  const response = await updateProduct(request, product.id)

  // Redirect on success (use updated SKU in case it changed)
  if (response.success && response.data) {
    return redirect(`/products/${response.data.sku}`)
  }

  return response
}

export default function EditProduct({ loaderData }: Route.ComponentProps) {
  const { product } = loaderData
  const actionData = useActionData<typeof action>()
  const navigation = useNavigation()
  const isSubmitting = navigation.state === 'submitting'

  return (
    <div className='mx-auto max-w-2xl p-6'>
      <h1 className='mb-6 text-2xl font-bold'>Edit Product</h1>

      <Form method='post' className='space-y-6'>
        {actionData?.message && !actionData.success && (
          <div className='bg-destructive/10 text-destructive rounded-md p-4 text-sm'>
            {actionData.message}
          </div>
        )}

        <div>
          <label htmlFor='sku' className='mb-2 block text-sm font-medium'>
            SKU (Stock Keeping Unit) *
          </label>
          <input
            type='text'
            id='sku'
            name='sku'
            required
            defaultValue={product.sku}
            placeholder='PROD-001'
            className='border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none'
          />
          {actionData && 'errors' in actionData && actionData.errors?.sku && (
            <p className='text-destructive mt-1 text-xs'>
              {actionData.errors.sku}
            </p>
          )}
          <p className='text-muted-foreground mt-1 text-xs'>
            Unique identifier for this product in your organization
          </p>
        </div>

        <div>
          <label htmlFor='name' className='mb-2 block text-sm font-medium'>
            Product Name *
          </label>
          <input
            type='text'
            id='name'
            name='name'
            required
            defaultValue={product.name}
            placeholder='Premium Widget'
            className='border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none'
          />
          {actionData && 'errors' in actionData && actionData.errors?.name && (
            <p className='text-destructive mt-1 text-xs'>
              {actionData.errors.name}
            </p>
          )}
        </div>

        <div className='grid grid-cols-2 gap-4'>
          <div>
            <label htmlFor='price' className='mb-2 block text-sm font-medium'>
              Price *
            </label>
            <input
              type='number'
              id='price'
              name='price'
              required
              step='0.01'
              min='0'
              defaultValue={product.price.toString()}
              placeholder='99.99'
              className='border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none'
            />
            {actionData &&
              'errors' in actionData &&
              actionData.errors?.price && (
                <p className='text-destructive mt-1 text-xs'>
                  {actionData.errors.price}
                </p>
              )}
          </div>

          <div>
            <label htmlFor='stock' className='mb-2 block text-sm font-medium'>
              Stock
            </label>
            <input
              type='number'
              id='stock'
              name='stock'
              min='0'
              defaultValue={product.stock ?? 0}
              placeholder='0'
              className='border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none'
            />
            {actionData &&
              'errors' in actionData &&
              actionData.errors?.stock && (
                <p className='text-destructive mt-1 text-xs'>
                  {actionData.errors.stock}
                </p>
              )}
          </div>
        </div>

        <div className='flex gap-3'>
          <Button type='submit' disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </Button>
          <Button type='button' variant='outline' asChild>
            <a href={`/products/${product.sku}`}>Cancel</a>
          </Button>
        </div>
      </Form>
    </div>
  )
}
