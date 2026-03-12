import { Link, useFetcher } from 'react-router'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { quotationsRepository } from '~/features/quotations/server/repository'
import { updateQuotationStatusAction } from '~/features/quotations/server/actions/update-status.action'
import { convertToOrderAction } from '~/features/quotations/server/actions/convert-to-order.action'
import { requireAuth } from '~/server/auth/session.server'
import { redirectWithFlash } from '~/server/flash.server'
import { redirect } from 'react-router'
import type { Route } from './+types/show'

export async function loader({ request, params }: Route.LoaderArgs) {
  const session = await requireAuth(request)
  const organizationId = session.session.activeOrganizationId

  if (!organizationId) {
    return redirectWithFlash('/purchase/quotations', {
      type: 'error',
      message: 'No active organization',
    })
  }

  const quotation = await quotationsRepository.getById(params.id)
  if (!quotation || quotation.organizationId !== organizationId) {
    return redirectWithFlash('/purchase/quotations', {
      type: 'error',
      message: 'Quotation not found',
    })
  }

  return { quotation }
}

export async function action({ request, params }: Route.ActionArgs) {
  const formData = await request.clone().formData()
  const intent = formData.get('intent')

  if (intent === 'updateStatus') {
    return await updateQuotationStatusAction(request, params.id)
  }

  if (intent === 'convertToOrder') {
    const result = await convertToOrderAction(request, params.id)
    if (result.success && result.data) {
      return redirect(`/purchase/orders/${result.data.id}`)
    }
    return result
  }

  return { success: false, message: 'Unknown action' }
}

const statusConfig: Record<
  string,
  {
    label: string
    variant: 'default' | 'secondary' | 'destructive' | 'outline'
  }
> = {
  DRAFT: { label: 'Draft', variant: 'secondary' },
  SENT: { label: 'Sent', variant: 'default' },
  ACCEPTED: { label: 'Accepted', variant: 'outline' },
  REJECTED: { label: 'Rejected', variant: 'destructive' },
}

export default function ShowQuotation({ loaderData }: Route.ComponentProps) {
  const { quotation } = loaderData
  const fetcher = useFetcher()
  const isUpdating = fetcher.state !== 'idle'

  const config = statusConfig[quotation.status] ?? {
    label: quotation.status,
    variant: 'secondary' as const,
  }

  const grandTotal = quotation.details.reduce(
    (sum, d) => sum + Number(d.lineTotal),
    0
  )

  const canConvert =
    quotation.status === 'ACCEPTED' && !quotation.convertedOrderId

  return (
    <div className='p-6'>
      {/* Header */}
      <div className='mb-6 flex items-start justify-between'>
        <div>
          <div className='flex items-center gap-3'>
            <h1 className='font-mono text-2xl font-bold'>
              {quotation.quotationNumber}
            </h1>
            <Badge variant={config.variant}>{config.label}</Badge>
          </div>
          <p className='text-muted-foreground mt-1 text-sm'>
            {quotation.businessPartnerName} &middot;{' '}
            {new Date(quotation.quotationDate).toLocaleDateString()}
          </p>
        </div>
        <div className='flex items-center gap-2'>
          {/* Status transition buttons */}
          {quotation.status === 'DRAFT' && (
            <StatusButton
              fetcher={fetcher}
              status='SENT'
              label='Send'
              disabled={isUpdating}
            />
          )}
          {quotation.status === 'SENT' && (
            <>
              <StatusButton
                fetcher={fetcher}
                status='ACCEPTED'
                label='Accept'
                disabled={isUpdating}
              />
              <StatusButton
                fetcher={fetcher}
                status='REJECTED'
                label='Reject'
                variant='destructive'
                disabled={isUpdating}
              />
            </>
          )}
          {canConvert && (
            <fetcher.Form method='post'>
              <input type='hidden' name='intent' value='convertToOrder' />
              <Button type='submit' disabled={isUpdating} size='sm'>
                Convert to Order
              </Button>
            </fetcher.Form>
          )}
          {quotation.convertedOrderId && (
            <Link to={`/purchase/orders/${quotation.convertedOrderId}`}>
              <Button variant='outline' size='sm'>
                View Order
              </Button>
            </Link>
          )}
          <Link to='/purchase/quotations'>
            <Button variant='outline'>Back to Quotations</Button>
          </Link>
        </div>
      </div>

      {fetcher.data && 'message' in fetcher.data && !fetcher.data.success && (
        <div className='bg-destructive/10 text-destructive mb-6 rounded-lg p-4 text-sm'>
          {fetcher.data.message as string}
        </div>
      )}

      <div className='grid gap-6 md:grid-cols-3'>
        {/* Quotation Info */}
        <Card>
          <CardHeader>
            <CardTitle>Quotation Information</CardTitle>
          </CardHeader>
          <CardContent className='space-y-3'>
            <div>
              <label className='text-muted-foreground text-sm font-medium'>
                Company
              </label>
              <p className='font-medium'>{quotation.companyName}</p>
            </div>
            <div>
              <label className='text-muted-foreground text-sm font-medium'>
                Business Partner
              </label>
              <p className='font-medium'>{quotation.businessPartnerName}</p>
            </div>
            <div>
              <label className='text-muted-foreground text-sm font-medium'>
                Quotation Date
              </label>
              <p>{new Date(quotation.quotationDate).toLocaleDateString()}</p>
            </div>
            <div>
              <label className='text-muted-foreground text-sm font-medium'>
                Currency
              </label>
              <p>{quotation.currencyCode}</p>
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
              <p className='text-2xl font-bold'>{quotation.details.length}</p>
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
                <tr className='bg-muted/40 border-b'>
                  <th className='px-4 py-2.5 text-left font-medium'>Product</th>
                  <th className='px-4 py-2.5 text-left font-medium'>SKU</th>
                  <th className='px-4 py-2.5 text-right font-medium'>Qty</th>
                  <th className='px-4 py-2.5 text-right font-medium'>
                    Unit Price
                  </th>
                  <th className='px-4 py-2.5 text-center font-medium'>
                    Source
                  </th>
                  <th className='px-4 py-2.5 text-right font-medium'>Total</th>
                </tr>
              </thead>
              <tbody className='divide-y'>
                {quotation.details.map((detail) => (
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
                    <td className='text-muted-foreground px-4 py-3 font-mono text-xs'>
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
                <tr className='bg-muted/20 border-t'>
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
              Quotation ID
            </label>
            <p className='font-mono text-sm'>{quotation.id}</p>
          </div>
          <div>
            <label className='text-muted-foreground text-sm font-medium'>
              Created
            </label>
            <p className='text-sm'>
              {new Date(quotation.createdAt).toLocaleString()}
            </p>
          </div>
          <div>
            <label className='text-muted-foreground text-sm font-medium'>
              Last Updated
            </label>
            <p className='text-sm'>
              {new Date(quotation.updatedAt).toLocaleString()}
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
