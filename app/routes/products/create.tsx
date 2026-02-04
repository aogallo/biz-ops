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
import { createProduct } from '~/features/products/server/actions/create.action'
import type { Route } from './+types/create'

export async function loader({ request }: Route.LoaderArgs) {
  // Action handles auth, but loader ensures page is protected
  const { requireAuth } = await import('~/server/auth/session.server')
  await requireAuth(request)
  return {}
}

export async function action({ request }: Route.ActionArgs) {
  const response = await createProduct(request)

  // Redirect on success
  if (response.success && response.data) {
    return redirect(`/products/${response.data.sku}`)
  }

  return response
}

export default function CreateProduct() {
  const actionData = useActionData<typeof action>()
  const navigation = useNavigation()
  const isSubmitting = navigation.state === 'submitting'

  return (
    <div className='mx-auto max-w-4xl p-6'>
      <Card>
        <CardHeader>
          <CardTitle>Create New Product</CardTitle>
          <CardDescription>
            Add a new product to your inventory
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
                  placeholder='PROD-001'
                  className='border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none'
                />
                {actionData?.errors?.sku && (
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
                  placeholder='Premium Widget'
                  className='border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none'
                />
                {actionData?.errors?.name && (
                  <p className='text-destructive mt-1 text-xs'>
                    {actionData.errors.name}
                  </p>
                )}
              </div>
            </div>

            <div className='grid gap-6 sm:grid-cols-2'>
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
                  placeholder='99.99'
                  className='border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none'
                />
                {actionData?.errors?.price && (
                  <p className='text-destructive mt-1 text-xs'>
                    {actionData.errors.price}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor='stock' className='mb-2 block text-sm font-medium'>
                  Initial Stock
                </label>
                <input
                  type='number'
                  id='stock'
                  name='stock'
                  min='0'
                  defaultValue='0'
                  placeholder='0'
                  className='border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none'
                />
                {actionData?.errors?.stock && (
                  <p className='text-destructive mt-1 text-xs'>
                    {actionData.errors.stock}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
          <CardFooter className='flex justify-end gap-3 border-t pt-6'>
            <Button type='button' variant='outline' asChild>
              <a href='/products'>Cancel</a>
            </Button>
            <Button type='submit' disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Product'}
            </Button>
          </CardFooter>
        </Form>
      </Card>
    </div>
  )
}
