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
import { productsRepository } from '~/features/products/server/repository'
import { createStockMovement } from '~/features/stock/server/actions/create-movement.action'
import { requireAuth } from '~/server/auth/session.server'
import type { Route } from './+types/new'

export async function loader({ request }: Route.LoaderArgs) {
  const session = await requireAuth(request)
  const organizationId = session.session.activeOrganizationId
  const products = organizationId
    ? await productsRepository.getAllByOrganization(organizationId)
    : []
  return { products }
}

export async function action({ request }: Route.ActionArgs) {
  const response = await createStockMovement(request)
  if (response.success) {
    return redirect('/stock')
  }
  return response
}

export default function NewStockMovement({ loaderData }: Route.ComponentProps) {
  const { products } = loaderData
  const actionData = useActionData<typeof action>()
  const navigation = useNavigation()
  const isSubmitting = navigation.state === 'submitting'

  const inputClass =
    'border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none'

  return (
    <div className='mx-auto max-w-2xl p-6'>
      <Card>
        <CardHeader>
          <CardTitle>New Stock Movement</CardTitle>
          <CardDescription>
            Record a stock entry, exit, or adjustment
          </CardDescription>
        </CardHeader>
        <Form method='post'>
          <CardContent className='space-y-6'>
            {actionData?.message && !actionData.success && (
              <div className='bg-destructive/10 text-destructive rounded-md p-4 text-sm'>
                {actionData.message}
              </div>
            )}

            <div>
              <label
                htmlFor='productId'
                className='mb-2 block text-sm font-medium'
              >
                Product *
              </label>
              <select
                id='productId'
                name='productId'
                required
                className={inputClass}
              >
                <option value=''>Select a product</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.sku}) - Stock: {p.stock ?? 0}
                  </option>
                ))}
              </select>
              {actionData &&
                'errors' in actionData &&
                actionData.errors?.productId && (
                  <p className='text-destructive mt-1 text-xs'>
                    {actionData.errors.productId}
                  </p>
                )}
            </div>

            <div className='grid gap-6 sm:grid-cols-2'>
              <div>
                <label
                  htmlFor='type'
                  className='mb-2 block text-sm font-medium'
                >
                  Movement Type *
                </label>
                <select id='type' name='type' required className={inputClass}>
                  <option value='entry'>Entry (Stock In)</option>
                  <option value='exit'>Exit (Stock Out)</option>
                  <option value='adjustment'>Adjustment (Set Absolute)</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor='quantity'
                  className='mb-2 block text-sm font-medium'
                >
                  Quantity *
                </label>
                <input
                  type='number'
                  id='quantity'
                  name='quantity'
                  required
                  min='1'
                  placeholder='10'
                  className={inputClass}
                />
                {actionData &&
                  'errors' in actionData &&
                  actionData.errors?.quantity && (
                    <p className='text-destructive mt-1 text-xs'>
                      {actionData.errors.quantity}
                    </p>
                  )}
              </div>
            </div>

            <div>
              <label
                htmlFor='reason'
                className='mb-2 block text-sm font-medium'
              >
                Reason *
              </label>
              <input
                type='text'
                id='reason'
                name='reason'
                required
                placeholder='e.g. Purchase order #123, Inventory count, Damaged goods'
                className={inputClass}
              />
              {actionData &&
                'errors' in actionData &&
                actionData.errors?.reason && (
                  <p className='text-destructive mt-1 text-xs'>
                    {actionData.errors.reason}
                  </p>
                )}
            </div>

            <div className='grid gap-6 sm:grid-cols-2'>
              <div>
                <label
                  htmlFor='movementDate'
                  className='mb-2 block text-sm font-medium'
                >
                  Date
                </label>
                <input
                  type='date'
                  id='movementDate'
                  name='movementDate'
                  defaultValue={new Date().toISOString().split('T')[0]}
                  className={inputClass}
                />
              </div>

              <div>
                <label
                  htmlFor='notes'
                  className='mb-2 block text-sm font-medium'
                >
                  Notes
                </label>
                <input
                  type='text'
                  id='notes'
                  name='notes'
                  placeholder='Optional notes...'
                  className={inputClass}
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className='flex justify-end gap-3 border-t pt-6'>
            <Button type='button' variant='outline' asChild>
              <a href='/stock'>Cancel</a>
            </Button>
            <Button type='submit' disabled={isSubmitting}>
              {isSubmitting ? 'Recording...' : 'Record Movement'}
            </Button>
          </CardFooter>
        </Form>
      </Card>
    </div>
  )
}
