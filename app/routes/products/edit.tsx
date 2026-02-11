import { Form, redirect, useActionData, useNavigation } from 'react-router'
import { Button } from '~/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '~/components/ui/card'
import { categoriesRepository } from '~/features/categories/server/repository'
import { PRODUCT_MESSAGES } from '~/features/products/messages'
import { updateProduct } from '~/features/products/server/actions/update.action'
import { productsRepository } from '~/features/products/server/repository'
import { requireAuth } from '~/server/auth/session.server'
import { redirectWithFlash } from '~/server/flash.server'
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

  const [product, categories] = await Promise.all([
    productsRepository.getBySku(organizationId, sku),
    categoriesRepository.getAllByOrganization(organizationId),
  ])

  if (!product) {
    return redirectWithFlash('/products', {
      type: 'error',
      message: PRODUCT_MESSAGES.notFound,
    })
  }

  return { product, categories }
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

  const response = await updateProduct(request, product.id)
  if (response.success && response.data) {
    return redirect(`/products/${response.data.sku}`)
  }
  return response
}

export default function EditProduct({ loaderData }: Route.ComponentProps) {
  const { product, categories } = loaderData
  const actionData = useActionData<typeof action>()
  const navigation = useNavigation()
  const isSubmitting = navigation.state === 'submitting'

  const inputClass =
    'border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none'

  return (
    <div className='mx-auto max-w-4xl p-6'>
      <Card>
        <CardHeader>
          <CardTitle>Edit Product</CardTitle>
          <CardDescription>
            Update the details for this product
          </CardDescription>
        </CardHeader>
        <Form method='post'>
          <CardContent className='space-y-6'>
            {actionData?.message && !actionData.success && (
              <div className='bg-destructive/10 text-destructive rounded-md p-4 text-sm'>
                {actionData.message}
              </div>
            )}

            <div className='grid gap-6 sm:grid-cols-2'>
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
                  className={inputClass}
                />
                {actionData &&
                  'errors' in actionData &&
                  actionData.errors?.sku && (
                    <p className='text-destructive mt-1 text-xs'>
                      {actionData.errors.sku}
                    </p>
                  )}
              </div>

              <div>
                <label
                  htmlFor='name'
                  className='mb-2 block text-sm font-medium'
                >
                  Product Name *
                </label>
                <input
                  type='text'
                  id='name'
                  name='name'
                  required
                  defaultValue={product.name}
                  placeholder='Premium Widget'
                  className={inputClass}
                />
                {actionData &&
                  'errors' in actionData &&
                  actionData.errors?.name && (
                    <p className='text-destructive mt-1 text-xs'>
                      {actionData.errors.name}
                    </p>
                  )}
              </div>
            </div>

            <div className='grid gap-6 sm:grid-cols-2'>
              <div>
                <label
                  htmlFor='price'
                  className='mb-2 block text-sm font-medium'
                >
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
                  className={inputClass}
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
                <label
                  htmlFor='categoryId'
                  className='mb-2 block text-sm font-medium'
                >
                  Category
                </label>
                <select
                  id='categoryId'
                  name='categoryId'
                  defaultValue={product.categoryId || ''}
                  className={inputClass}
                >
                  <option value=''>No category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className='grid gap-6 sm:grid-cols-2'>
              <div>
                <label
                  htmlFor='stock'
                  className='mb-2 block text-sm font-medium'
                >
                  Stock
                </label>
                <input
                  type='number'
                  id='stock'
                  name='stock'
                  min='0'
                  defaultValue={product.stock ?? 0}
                  placeholder='0'
                  className={inputClass}
                />
                {actionData &&
                  'errors' in actionData &&
                  actionData.errors?.stock && (
                    <p className='text-destructive mt-1 text-xs'>
                      {actionData.errors.stock}
                    </p>
                  )}
              </div>

              <div>
                <label
                  htmlFor='minStock'
                  className='mb-2 block text-sm font-medium'
                >
                  Minimum Stock (Alert Threshold)
                </label>
                <input
                  type='number'
                  id='minStock'
                  name='minStock'
                  min='0'
                  defaultValue={product.minStock ?? 0}
                  placeholder='10'
                  className={inputClass}
                />
                {actionData &&
                  'errors' in actionData &&
                  actionData.errors?.minStock && (
                    <p className='text-destructive mt-1 text-xs'>
                      {actionData.errors.minStock}
                    </p>
                  )}
              </div>
            </div>

            <div>
              <label
                htmlFor='description'
                className='mb-2 block text-sm font-medium'
              >
                Description
              </label>
              <textarea
                id='description'
                name='description'
                rows={3}
                defaultValue={product.description || ''}
                placeholder='Product description...'
                className={inputClass}
              />
            </div>

            <div>
              <label
                htmlFor='imageUrl'
                className='mb-2 block text-sm font-medium'
              >
                Image URL
              </label>
              <input
                type='url'
                id='imageUrl'
                name='imageUrl'
                defaultValue={product.imageUrl || ''}
                placeholder='https://example.com/image.jpg'
                className={inputClass}
              />
            </div>
          </CardContent>
          <CardFooter className='flex justify-end gap-3 border-t pt-6'>
            <Button type='button' variant='outline' asChild>
              <a href={`/products/${product.sku}`}>Cancel</a>
            </Button>
            <Button type='submit' disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </CardFooter>
        </Form>
      </Card>
    </div>
  )
}
