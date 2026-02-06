import { format } from 'date-fns'
import { ArrowLeft, CalendarIcon } from 'lucide-react'
import { useCallback, useState } from 'react'
import { Link, redirect, useFetcher, useNavigate, useRevalidator } from 'react-router'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Calendar } from '~/components/ui/calendar'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card'
import { Combobox, type ComboboxOption } from '~/components/ui/combobox'
import { Label } from '~/components/ui/label'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '~/components/ui/popover'
import { accountsRepository } from '~/features/accounts/server/repository'
import { businessPartnersRepository } from '~/features/business-partners/server/repository'
import { companyRepository } from '~/features/company/server/repository/company.repository'
import {
  InvoiceLineTable,
  InvoiceSummary,
  PostInvoiceButton,
  type AccountOption,
  type BusinessPartnerOption,
  type CompanyOption,
  type InvoiceLineData,
  type ProductOption,
} from '~/features/invoice/components'
import { addInvoiceLineSchema, updateInvoiceLineSchema } from '~/features/invoice/schemas'
import { addInvoiceLineAction } from '~/features/invoice/server/actions/add-line.action'
import { postInvoiceAction } from '~/features/invoice/server/actions/post-invoice.action'
import { removeInvoiceLineAction } from '~/features/invoice/server/actions/remove-line.action'
import { updateInvoiceAction } from '~/features/invoice/server/actions/update-invoice.action'
import { updateInvoiceLineAction } from '~/features/invoice/server/actions/update-line.action'
import { invoiceRepository } from '~/features/invoice/server/repository'
import { productsRepository } from '~/features/products/server/repository'
import { requireAuth } from '~/server/auth/session.server'
import { cn } from '~/lib/utils'
import type { Route } from './+types/$id.edit'

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

  // Only allow editing draft invoices
  if (invoice.status !== 'draft') {
    return redirect(`/invoices/${params.id}`)
  }

  const [companies, businessPartners, products, accounts] = await Promise.all([
    companyRepository.getByOrganization(organizationId),
    businessPartnersRepository.getAllByOrganization(organizationId),
    productsRepository.getAllByOrganization(organizationId),
    accountsRepository.getAllByOrganization(organizationId),
  ])

  return {
    invoice,
    companies: companies.map(
      (c): CompanyOption => ({
        id: c.id,
        name: c.name,
      })
    ),
    businessPartners: businessPartners.map(
      (bp): BusinessPartnerOption => ({
        id: bp.id,
        name: bp.name,
        nit: bp.nit,
      })
    ),
    products: products.map(
      (p): ProductOption => ({
        id: p.id,
        sku: p.sku,
        name: p.name,
        price: p.price,
      })
    ),
    accounts: accounts.map(
      (a): AccountOption => ({
        id: a.id,
        accountNumber: a.accountNumber,
        name: a.name,
      })
    ),
  }
}

export async function action({ request, params }: Route.ActionArgs) {
  const session = await requireAuth(request)
  const organizationId = session.session.activeOrganizationId

  if (!organizationId) {
    return { success: false, error: 'No organization selected' }
  }

  const formData = await request.formData()
  const actionType = formData.get('_action') as string

  // Validate invoice belongs to organization
  const invoice = await invoiceRepository.getById(params.id)
  if (!invoice || invoice.organizationId !== organizationId) {
    return { success: false, error: 'Invoice not found' }
  }

  if (invoice.status !== 'draft') {
    return { success: false, error: 'Only draft invoices can be edited' }
  }

  switch (actionType) {
    case 'updateHeader': {
      const invoiceDateStr = formData.get('invoiceDate') as string
      const dueDateStr = formData.get('dueDate') as string
      const businessPartnerId = formData.get('businessPartnerId') as string

      const result = await updateInvoiceAction(params.id, {
        invoiceDate: invoiceDateStr ? new Date(invoiceDateStr) : undefined,
        dueDate: dueDateStr ? new Date(dueDateStr) : null,
        businessPartnerId: businessPartnerId || undefined,
      })

      return result
    }

    case 'addLine': {
      const input = {
        invoiceId: params.id,
        description: formData.get('description') as string,
        quantity: parseFloat(formData.get('quantity') as string) || 1,
        unitPrice: parseFloat(formData.get('unitPrice') as string) || 0,
        ivaType: (formData.get('ivaType') as 'taxed' | 'exempt' | 'non_subject') || 'taxed',
        ivaRate: 12,
        productId: (formData.get('productId') as string) || null,
        accountingAccountId: formData.get('accountingAccountId') as string,
      }

      const validation = addInvoiceLineSchema.safeParse(input)
      if (!validation.success) {
        return {
          success: false,
          error: validation.error.issues[0]?.message || 'Invalid input',
        }
      }

      const result = await addInvoiceLineAction(validation.data)
      return result
    }

    case 'updateLine': {
      const input = {
        lineId: formData.get('lineId') as string,
        description: formData.get('description') as string,
        quantity: parseFloat(formData.get('quantity') as string),
        unitPrice: parseFloat(formData.get('unitPrice') as string),
        ivaType: (formData.get('ivaType') as 'taxed' | 'exempt' | 'non_subject'),
        ivaRate: 12,
        productId: (formData.get('productId') as string) || null,
        accountingAccountId: formData.get('accountingAccountId') as string,
      }

      const validation = updateInvoiceLineSchema.safeParse(input)
      if (!validation.success) {
        return {
          success: false,
          error: validation.error.issues[0]?.message || 'Invalid input',
        }
      }

      const result = await updateInvoiceLineAction(validation.data)
      return result
    }

    case 'removeLine': {
      const lineId = formData.get('lineId') as string
      const invoiceId = formData.get('invoiceId') as string

      const result = await removeInvoiceLineAction(lineId, invoiceId)
      return result
    }

    case 'postInvoice': {
      const result = await postInvoiceAction(params.id)

      if (result.success) {
        return redirect(`/invoices/${params.id}`)
      }

      return { success: false, error: result.error }
    }

    default:
      return { success: false, error: 'Unknown action' }
  }
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

export default function InvoiceEditPage({
  loaderData,
}: Route.ComponentProps) {
  const { invoice, businessPartners, products, accounts } = loaderData
  const navigate = useNavigate()
  const revalidator = useRevalidator()
  const headerFetcher = useFetcher()

  // Local state for header editing
  const [businessPartnerId, setBusinessPartnerId] = useState(
    invoice.businessPartnerId
  )
  const [invoiceDate, setInvoiceDate] = useState<Date | undefined>(
    invoice.invoiceDate ? new Date(invoice.invoiceDate) : undefined
  )
  const [dueDate, setDueDate] = useState<Date | undefined>(
    invoice.dueDate ? new Date(invoice.dueDate) : undefined
  )

  const partnerOptions: ComboboxOption[] = businessPartners.map((partner) => ({
    value: partner.id,
    label: partner.name,
    description: partner.nit || undefined,
  }))

  // Convert invoice lines to the format expected by InvoiceLineTable
  const lines: InvoiceLineData[] = invoice.lines.map((line) => ({
    id: line.id,
    lineNumber: line.lineNumber,
    description: line.description,
    quantity: Number(line.quantity),
    unitPrice: Number(line.unitPrice),
    ivaType: line.ivaType,
    ivaRate: Number(line.ivaRate),
    subtotal: Number(line.subtotal),
    ivaAmount: Number(line.ivaAmount),
    total: Number(line.total),
    productId: line.productId,
    accountingAccountId: line.accountingAccountId,
    product: line.product,
    accountingAccount: line.accountingAccount,
  }))

  // Calculate totals
  const totals = {
    subtotal: lines.reduce((sum, line) => sum + line.subtotal, 0),
    ivaAmount: lines.reduce((sum, line) => sum + line.ivaAmount, 0),
    total: lines.reduce((sum, line) => sum + line.total, 0),
  }

  const handleLinesChanged = useCallback(() => {
    revalidator.revalidate()
  }, [revalidator])

  const handlePosted = useCallback(() => {
    navigate(`/invoices/${invoice.id}`)
  }, [navigate, invoice.id])

  const saveHeaderChanges = useCallback(() => {
    headerFetcher.submit(
      {
        _action: 'updateHeader',
        businessPartnerId,
        invoiceDate: invoiceDate?.toISOString() || '',
        dueDate: dueDate?.toISOString() || '',
      },
      { method: 'post' }
    )
  }, [headerFetcher, businessPartnerId, invoiceDate, dueDate])

  return (
    <div className="container mx-auto py-6">
      {/* Header with Actions */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to={`/invoices/${invoice.id}`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Edit Invoice</h1>
            <div className="mt-1 flex items-center gap-2">
              {getTypeBadge(invoice.type)}
              <Badge variant="secondary">Draft</Badge>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link to={`/invoices/${invoice.id}`}>View Invoice</Link>
          </Button>
          <PostInvoiceButton
            invoiceId={invoice.id}
            hasLines={lines.length > 0}
            onPosted={handlePosted}
          />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header Details */}
          <Card>
            <CardHeader>
              <CardTitle>Invoice Details</CardTitle>
              <CardDescription>
                Edit invoice header information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-muted-foreground text-sm mb-1">Company</p>
                  <p className="font-medium">{invoice.company?.name || '-'}</p>
                </div>

                <div className="space-y-2">
                  <Label>
                    {invoice.type === 'sale' ? 'Customer' : 'Vendor'}
                  </Label>
                  <Combobox
                    options={partnerOptions}
                    value={businessPartnerId}
                    onValueChange={(value) => {
                      setBusinessPartnerId(value)
                      setTimeout(saveHeaderChanges, 0)
                    }}
                    placeholder="Select business partner..."
                    searchPlaceholder="Search by name or NIT..."
                    emptyMessage="No business partners found."
                  />
                </div>

                <div className="space-y-2">
                  <Label>Invoice Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-full justify-start text-left font-normal',
                          !invoiceDate && 'text-muted-foreground'
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {invoiceDate
                          ? format(invoiceDate, 'PPP')
                          : 'Select date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={invoiceDate}
                        onSelect={(date) => {
                          setInvoiceDate(date)
                          setTimeout(saveHeaderChanges, 0)
                        }}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label>Due Date (Optional)</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-full justify-start text-left font-normal',
                          !dueDate && 'text-muted-foreground'
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dueDate ? format(dueDate, 'PPP') : 'Select date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={dueDate}
                        onSelect={(date) => {
                          setDueDate(date)
                          setTimeout(saveHeaderChanges, 0)
                        }}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Invoice Lines */}
          <InvoiceLineTable
            invoiceId={invoice.id}
            lines={lines}
            products={products}
            accounts={accounts}
            isDraft={true}
            onLinesChanged={handleLinesChanged}
          />
        </div>

        {/* Summary Sidebar */}
        <div>
          <InvoiceSummary
            subtotal={totals.subtotal}
            ivaAmount={totals.ivaAmount}
            total={totals.total}
          />

          {lines.length === 0 && (
            <Card className="mt-6">
              <CardContent className="py-6">
                <div className="text-center text-muted-foreground">
                  <p className="font-medium">No lines added yet</p>
                  <p className="text-sm mt-1">
                    Add items to this invoice using the form above.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
