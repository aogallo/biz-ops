import { format } from 'date-fns'
import { ArrowLeft, Edit, FileText } from 'lucide-react'
import { Link, redirect, useRevalidator } from 'react-router'
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
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '~/components/ui/table'
import {
  InvoiceSummary,
  PostInvoiceButton,
  type ProductOption,
} from '~/features/invoice/components'
import { postInvoiceAction } from '~/features/invoice/server/actions/post-invoice.action'
import { invoiceRepository } from '~/features/invoice/server/repository'
import { journalEntryRepository } from '~/features/journal-entry/server/repository'
import { productsRepository } from '~/features/products/server/repository'
import { requireAuth } from '~/server/auth/session.server'
import type { Route } from './+types/$id'

export async function loader({ request, params }: Route.LoaderArgs) {
  const session = await requireAuth(request)
  const organizationId = session.session.activeOrganizationId

  if (!organizationId) {
    return redirect('/invoices')
  }

  const invoice = await invoiceRepository.getByIdWithDetails(params.id)

  if (!invoice || invoice.organizationId !== organizationId) {
    throw new Response('Not Found', { status: 404 })
  }

  // Get linked journal entry if exists
  const journalEntry = await journalEntryRepository.getByInvoiceId(invoice.id)

  // Get products for display
  const products = await productsRepository.getAllByOrganization(organizationId)

  return {
    invoice,
    journalEntry,
    products: products.map(
      (p): ProductOption => ({
        id: p.id,
        sku: p.sku,
        name: p.name,
        price: p.price,
      })
    ),
  }
}

export async function action({ request, params }: Route.ActionArgs) {
  const session = await requireAuth(request)
  const organizationId = session.session.activeOrganizationId

  if (!organizationId) {
    return { error: 'No organization selected' }
  }

  const formData = await request.formData()
  const actionType = formData.get('_action') as string

  // Validate invoice belongs to organization
  const invoice = await invoiceRepository.getById(params.id)
  if (!invoice || invoice.organizationId !== organizationId) {
    return { error: 'Invoice not found' }
  }

  if (actionType === 'postInvoice') {
    const result = await postInvoiceAction(params.id)

    if (!result.success) {
      return { success: false, error: result.error }
    }

    return {
      success: true,
      journalEntryId: result.journalEntry?.id,
    }
  }

  return { error: 'Unknown action' }
}

function getTypeBadge(type: string) {
  switch (type) {
    case 'sale':
      return (
        <Badge variant="outline" className="border-blue-500 text-blue-600">
          Sale Invoice
        </Badge>
      )
    case 'purchase':
      return (
        <Badge variant="outline" className="border-orange-500 text-orange-600">
          Purchase Invoice
        </Badge>
      )
    default:
      return <Badge variant="outline">{type}</Badge>
  }
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'draft':
      return <Badge variant="secondary">Draft</Badge>
    case 'pending':
      return <Badge variant="outline">Pending</Badge>
    case 'posted':
      return (
        <Badge variant="default" className="bg-green-600">
          Posted
        </Badge>
      )
    case 'voided':
      return <Badge variant="destructive">Voided</Badge>
    default:
      return <Badge variant="outline">{status}</Badge>
  }
}

export default function InvoiceShowPage({
  loaderData,
}: Route.ComponentProps) {
  const { invoice, journalEntry } = loaderData
  const revalidator = useRevalidator()

  const isDraft = invoice.status === 'draft'

  const handlePosted = () => {
    revalidator.revalidate()
  }

  // Calculate totals from lines
  const totals = {
    subtotal: invoice.lines.reduce((sum, line) => sum + Number(line.subtotal), 0),
    ivaAmount: invoice.lines.reduce((sum, line) => sum + Number(line.ivaAmount), 0),
    total: invoice.lines.reduce((sum, line) => sum + Number(line.total), 0),
  }

  return (
    <div className="container mx-auto py-6">
      {/* Header with Actions */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/invoices">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Invoice {invoice.number}</h1>
            <div className="mt-1 flex items-center gap-2">
              {getTypeBadge(invoice.type)}
              {getStatusBadge(invoice.status)}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isDraft && (
            <>
              <Button variant="outline" asChild>
                <Link to={`/invoices/${invoice.id}/edit`}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </Link>
              </Button>
              <PostInvoiceButton
                invoiceId={invoice.id}
                hasLines={invoice.lines.length > 0}
                onPosted={handlePosted}
              />
            </>
          )}
          {journalEntry && (
            <Button variant="outline" asChild>
              <Link to={`/journal-entries/${journalEntry.id}`}>
                <FileText className="mr-2 h-4 w-4" />
                View Journal Entry
              </Link>
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-6">
        {/* Invoice Details */}
        <div>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Invoice Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <div>
                  <p className="text-muted-foreground text-sm">Company</p>
                  <p className="font-medium">{invoice.company?.name || '-'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-sm">
                    {invoice.type === 'sale' ? 'Customer' : 'Vendor'}
                  </p>
                  <p className="font-medium">
                    {invoice.businessPartner?.name || '-'}
                  </p>
                  {invoice.businessPartner?.nit && (
                    <p className="text-muted-foreground text-xs">
                      NIT: {invoice.businessPartner.nit}
                    </p>
                  )}
                </div>
                <div>
                  <p className="text-muted-foreground text-sm">Invoice Date</p>
                  <p className="font-medium">
                    {format(new Date(invoice.invoiceDate), 'PPP')}
                  </p>
                </div>
                {invoice.dueDate && (
                  <div>
                    <p className="text-muted-foreground text-sm">Due Date</p>
                    <p className="font-medium">
                      {format(new Date(invoice.dueDate), 'PPP')}
                    </p>
                  </div>
                )}
                {invoice.serie && (
                  <div>
                    <p className="text-muted-foreground text-sm">Serie</p>
                    <p className="font-medium">{invoice.serie}</p>
                  </div>
                )}
                {invoice.authorizationNumber && (
                  <div>
                    <p className="text-muted-foreground text-sm">
                      Authorization Number
                    </p>
                    <p className="font-medium">{invoice.authorizationNumber}</p>
                  </div>
                )}
                <div>
                  <p className="text-muted-foreground text-sm">Source</p>
                  <p className="font-medium capitalize">{invoice.source}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-sm">
                    {invoice.type === 'sale' ? 'Revenue Account' : 'Expense Account'}
                  </p>
                  <p className="font-medium">
                    {invoice.accountingAccount
                      ? `${invoice.accountingAccount.accountNumber} - ${invoice.accountingAccount.name}`
                      : '-'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Invoice Lines */}
          <Card>
            <CardHeader>
              <CardTitle>Invoice Lines</CardTitle>
              <CardDescription>
                {invoice.lines.length} line{invoice.lines.length !== 1 ? 's' : ''}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {invoice.lines.length === 0 ? (
                <div className="text-muted-foreground py-8 text-center">
                  No lines in this invoice
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[40px]">#</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="w-[100px] text-right">Qty</TableHead>
                        <TableHead className="w-[120px] text-right">
                          Unit Price
                        </TableHead>
                        <TableHead className="w-[120px] text-right">
                          Subtotal
                        </TableHead>
                        <TableHead className="w-[100px] text-right">IVA</TableHead>
                        <TableHead className="w-[120px] text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {invoice.lines.map((line, index) => (
                        <TableRow key={line.id}>
                          <TableCell className="text-muted-foreground">
                            {index + 1}
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{line.description}</p>
                              {line.product && (
                                <p className="text-muted-foreground text-xs">
                                  SKU: {line.product.sku}
                                </p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {Number(line.quantity).toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            Q {Number(line.unitPrice).toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            Q {Number(line.subtotal).toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            Q {Number(line.ivaAmount).toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right font-mono font-semibold">
                            Q {Number(line.total).toFixed(2)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                    <TableFooter>
                      <TableRow>
                        <TableCell colSpan={4} className="text-right font-semibold">
                          Totals
                        </TableCell>
                        <TableCell className="text-right font-mono font-semibold">
                          Q {totals.subtotal.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right font-mono font-semibold">
                          Q {totals.ivaAmount.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right font-mono font-semibold">
                          Q {totals.total.toFixed(2)}
                        </TableCell>
                      </TableRow>
                    </TableFooter>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Summary - Inline at full width */}
        <InvoiceSummary
          subtotal={totals.subtotal}
          ivaAmount={totals.ivaAmount}
          total={totals.total}
          lineCount={invoice.lines.length}
          variant="inline"
        />

        {/* Linked Journal Entry */}
        {journalEntry && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Linked Journal Entry</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap items-center gap-6">
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">Entry Number:</span>
                  <Link
                    to={`/journal-entries/${journalEntry.id}`}
                    className="font-medium text-blue-600 hover:underline"
                  >
                    {journalEntry.entryNumber}
                  </Link>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">Status:</span>
                  <span>{getStatusBadge(journalEntry.status)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
