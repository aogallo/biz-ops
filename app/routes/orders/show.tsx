import { Link, useFetcher } from 'react-router'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '~/components/ui/card'
import { ordersRepository } from '~/features/orders/server/repository'
import { updateOrderStatusAction } from '~/features/orders/server/actions/update-status.action'
import { requireAuth } from '~/server/auth/session.server'
import { redirectWithFlash } from '~/server/flash.server'
import type { Route } from './+types/show'

export async function loader({ request, params }: Route.LoaderArgs) {
  const session = await requireAuth(request)
  const organizationId = session.session.activeOrganizationId

  if (!organizationId) {
    return redirectWithFlash('/purchase/orders', {
      type: 'error',
      message: 'No active organization',
    })
  }

  const order = await ordersRepository.getById(params.id)
  if (!order || order.organizationId !== organizationId) {
    return redirectWithFlash('/purchase/orders', {
      type: 'error',
      message: 'Order not found',
    })
  }

  return { order }
}

export async function action({ request, params }: Route.ActionArgs) {
  const formData = await request.clone().formData()
  const intent = formData.get('intent')

  if (intent === 'updateStatus') {
    return await updateOrderStatusAction(request, params.id)
  }

  return { success: false, message: 'Unknown action' }
}

const statusConfig: Record<
  string,
  { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }
> = {
  DRAFT: { label: 'Draft', variant: 'secondary' },
  CONFIRMED: { label: 'Confirmed', variant: 'default' },
  COMPLETED: { label: 'Completed', variant: 'outline' },
  CANCELLED: { label: 'Cancelled', variant: 'destructive' },
}

export default function ShowOrder({ loaderData }: Route.ComponentProps) {
  const { order } = loaderData
  const fetcher = useFetcher()
  const isUpdating = fetcher.state !== 'idle'

  const config = statusConfig[order.status] ?? {
    label: order.status,
    variant: 'secondary' as const,
  }

  const grandTotal = order.details.reduce(
    (sum, d) => sum + Number(d.lineTotal),
    0
  )

  return (
    <div className='p-6'>
      {/* Header */}
      <div className='mb-6 flex items-start justify-between'>
        <div>
          <div className='flex items-center gap-3'>
            <h1 className='text-2xl font-bold font-mono'>
              {order.orderNumber}
            </h1>
            <Badge variant={config.variant}>{config.label}</Badge>
          </div>
          <p className='text-muted-foreground mt-1 text-sm'>
            {order.businessPartnerName} &middot;{' '}
            {new Date(order.orderDate).toLocaleDateString()}
          </p>
        </div>
        <div className='flex items-center gap-2'>
          {/* Status transition buttons */}
          {order.status === 'DRAFT' && (
            <>
              <StatusButton
                fetcher={fetcher}

                status='CONFIRMED'
                label='Confirm'
                disabled={isUpdating}
              />
              <StatusButton
                fetcher={fetcher}

                status='CANCELLED'
                label='Cancel'
                variant='destructive'
                disabled={isUpdating}
              />
            </>
          )}
          {order.status === 'CONFIRMED' && (
            <>
              <StatusButton
                fetcher={fetcher}

                status='COMPLETED'
                label='Complete'
                disabled={isUpdating}
              />
              <StatusButton
                fetcher={fetcher}

                status='CANCELLED'
                label='Cancel'
                variant='destructive'
                disabled={isUpdating}
              />
            </>
          )}
          <Link to='/purchase/orders'>
            <Button variant='outline'>Back to Orders</Button>
          </Link>
        </div>
      </div>

      {fetcher.data && 'message' in fetcher.data && !fetcher.data.success && (
        <div className='mb-6 rounded-lg bg-destructive/10 p-4 text-sm text-destructive'>
          {fetcher.data.message as string}
        </div>
      )}

      <div className='grid gap-6 md:grid-cols-3'>
        {/* Order Info */}
        <Card>
          <CardHeader>
            <CardTitle>Order Information</CardTitle>
          </CardHeader>
          <CardContent className='space-y-3'>
            <div>
              <label className='text-muted-foreground text-sm font-medium'>
                Company
              </label>
              <p className='font-medium'>{order.companyName}</p>
            </div>
            <div>
              <label className='text-muted-foreground text-sm font-medium'>
                Business Partner
              </label>
              <p className='font-medium'>{order.businessPartnerName}</p>
            </div>
            <div>
              <label className='text-muted-foreground text-sm font-medium'>
                Order Date
              </label>
              <p>{new Date(order.orderDate).toLocaleDateString()}</p>
            </div>
            <div>
              <label className='text-muted-foreground text-sm font-medium'>
                Currency
              </label>
              <p>{order.currencyCode}</p>
            </div>
          </CardContent>
        </Card>

        {/* Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Summary</CardTitle>
          </CardHeader>
          <CardContent className='space-y-3'>
            <div>
              <label className='text-muted-foreground text-sm font-medium'>
                Items
              </label>
              <p className='text-2xl font-bold'>{order.details.length}</p>
            </div>
            <div>
              <label className='text-muted-foreground text-sm font-medium'>
                Total
              </label>
              <p className='text-primary text-2xl font-bold'>
                ${grandTotal.toFixed(2)}
              </p>
            </div>
          </CardContent>
        </Card>

      </div>

      {/* Line Items Table */}
      <Card className='mt-6'>
        <CardHeader>
          <CardTitle>Line Items</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='overflow-hidden rounded-lg border'>
            <table className='w-full text-sm'>
              <thead>
                <tr className='border-b bg-muted/40'>
                  <th className='px-4 py-2.5 text-left font-medium'>
                    Product
                  </th>
                  <th className='px-4 py-2.5 text-left font-medium'>SKU</th>
                  <th className='px-4 py-2.5 text-right font-medium'>Qty</th>
                  <th className='px-4 py-2.5 text-right font-medium'>
                    Unit Price
                  </th>
                  <th className='px-4 py-2.5 text-center font-medium'>
                    Source
                  </th>
                  <th className='px-4 py-2.5 text-right font-medium'>
                    Total
                  </th>
                </tr>
              </thead>
              <tbody className='divide-y'>
                {order.details.map((detail) => (
                  <tr key={detail.id}>
                    <td className='px-4 py-3'>
                      <p className='font-medium'>{detail.productName}</p>
                      {detail.customAttributesJson &&
                        typeof detail.customAttributesJson === 'object' &&
                        Object.keys(
                          detail.customAttributesJson as Record<string, unknown>
                        ).length > 0 && (
                          <div className='mt-1 flex flex-wrap gap-1'>
                            {Object.entries(
                              detail.customAttributesJson as Record<
                                string,
                                unknown
                              >
                            ).map(([key, value]) => (
                              <Badge
                                key={key}
                                variant='outline'
                                className='text-xs'
                              >
                                {key}: {String(value)}
                              </Badge>
                            ))}
                          </div>
                        )}
                      {detail.recipients.length > 0 && (
                        <div className='mt-1 flex flex-wrap gap-1'>
                          {detail.recipients.map((r) => (
                            <Badge
                              key={r.id}
                              variant='secondary'
                              className='text-xs'
                            >
                              {r.name}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className='px-4 py-3 font-mono text-xs text-muted-foreground'>
                      {detail.productSku ?? '-'}
                    </td>
                    <td className='px-4 py-3 text-right'>{detail.quantity}</td>
                    <td className='px-4 py-3 text-right'>
                      ${Number(detail.unitPrice).toFixed(2)}
                    </td>
                    <td className='px-4 py-3 text-center'>
                      <Badge variant='outline' className='text-xs'>
                        {detail.sourceType}
                      </Badge>
                    </td>
                    <td className='px-4 py-3 text-right font-medium'>
                      ${Number(detail.lineTotal).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className='border-t bg-muted/20'>
                  <td
                    colSpan={5}
                    className='px-4 py-3 text-right font-semibold'
                  >
                    Grand Total
                  </td>
                  <td className='px-4 py-3 text-right text-lg font-bold'>
                    ${grandTotal.toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Metadata */}
      <Card className='mt-6'>
        <CardHeader>
          <CardTitle>Metadata</CardTitle>
        </CardHeader>
        <CardContent className='grid gap-4 md:grid-cols-3'>
          <div>
            <label className='text-muted-foreground text-sm font-medium'>
              Order ID
            </label>
            <p className='font-mono text-sm'>{order.id}</p>
          </div>
          <div>
            <label className='text-muted-foreground text-sm font-medium'>
              Created
            </label>
            <p className='text-sm'>
              {new Date(order.createdAt).toLocaleString()}
            </p>
          </div>
          <div>
            <label className='text-muted-foreground text-sm font-medium'>
              Last Updated
            </label>
            <p className='text-sm'>
              {new Date(order.updatedAt).toLocaleString()}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function StatusButton({
  fetcher,
  status,
  label,
  variant = 'default',
  disabled,
}: {
  fetcher: ReturnType<typeof useFetcher>
  status: string
  label: string
  variant?: 'default' | 'destructive'
  disabled: boolean
}) {
  return (
    <fetcher.Form method='post'>
      <input type='hidden' name='intent' value='updateStatus' />
      <input type='hidden' name='status' value={status} />
      <Button type='submit' variant={variant} disabled={disabled} size='sm'>
        {label}
      </Button>
    </fetcher.Form>
  )
}
