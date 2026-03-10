import { format } from 'date-fns'
import { CalendarIcon } from 'lucide-react'
import { useState } from 'react'
import { Form, Link, useNavigation } from 'react-router'
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
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '~/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'
import { cn } from '~/lib/utils'

export interface CompanyOption {
  id: string
  name: string
}

export interface BusinessPartnerOption {
  id: string
  name: string
  nit: string | null
}

export interface AccountOption {
  id: string
  accountNumber: string | null
  name: string | null
}

export interface SucursalOption {
  id: string
  name: string
  code: string
}

interface InvoiceFormProps {
  mode: 'create' | 'view'
  companies: CompanyOption[]
  businessPartners: BusinessPartnerOption[]
  accounts: AccountOption[]
  sucursales?: SucursalOption[]
  initialData?: {
    type: 'purchase' | 'sale'
    companyId: string
    businessPartnerId: string
    accountingAccountId?: string
    sucursalId?: string
    invoiceDate: Date
    dueDate?: Date | null
    serie?: string | null
    authorizationNumber?: string | null
    number?: string
    status?: string
  }
  actionData?: {
    error?: string
    fieldErrors?: Record<string, string[] | undefined>
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

export function InvoiceForm({
  mode,
  companies,
  businessPartners,
  accounts,
  sucursales = [],
  initialData,
  actionData,
}: InvoiceFormProps) {
  const navigation = useNavigation()
  const isSubmitting = navigation.state === 'submitting'

  // Form state
  const [type, setType] = useState<'purchase' | 'sale'>(
    initialData?.type ?? 'sale'
  )
  const [companyId, setCompanyId] = useState(initialData?.companyId ?? '')
  const [businessPartnerId, setBusinessPartnerId] = useState(
    initialData?.businessPartnerId ?? ''
  )
  const [accountingAccountId, setAccountingAccountId] = useState(
    initialData?.accountingAccountId ?? ''
  )
  const [sucursalId, setSucursalId] = useState(initialData?.sucursalId ?? '')
  const [invoiceDate, setInvoiceDate] = useState<Date | undefined>(
    initialData?.invoiceDate ?? new Date()
  )
  const [dueDate, setDueDate] = useState<Date | undefined>(
    initialData?.dueDate ?? undefined
  )

  // Filter business partners based on invoice type
  // For now, show all partners (could filter by type in the future)
  const filteredPartners = businessPartners

  const companyOptions: ComboboxOption[] = companies.map((company) => ({
    value: company.id,
    label: company.name,
  }))

  const partnerOptions: ComboboxOption[] = filteredPartners.map((partner) => ({
    value: partner.id,
    label: partner.name,
    description: partner.nit || undefined,
  }))

  const accountOptions: ComboboxOption[] = accounts.map((account) => ({
    value: account.id,
    label: `${account.accountNumber ?? ''} ${account.name ?? ''}`.trim(),
  }))

  const sucursalOptions: ComboboxOption[] = sucursales.map((s) => ({
    value: s.id,
    label: s.name,
    description: s.code,
  }))

  const isViewMode = mode === 'view'

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>
              {mode === 'create' ? 'New Invoice' : 'Invoice Details'}
            </CardTitle>
            <CardDescription>
              {mode === 'create'
                ? 'Create a new manual invoice'
                : `Invoice ${initialData?.number || 'DRAFT'}`}
            </CardDescription>
          </div>
          {initialData?.status && (
            <div className="flex items-center gap-2">
              {getStatusBadge(initialData.status)}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {/* Error display */}
        {actionData?.error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400">
            {actionData.error}
          </div>
        )}

        <Form method="post">
          {/* Hidden fields for form data */}
          <input type="hidden" name="type" value={type} />
          <input type="hidden" name="companyId" value={companyId} />
          <input type="hidden" name="businessPartnerId" value={businessPartnerId} />
          <input type="hidden" name="accountingAccountId" value={accountingAccountId} />
          <input type="hidden" name="sucursalId" value={sucursalId} />
          <input
            type="hidden"
            name="invoiceDate"
            value={invoiceDate ? invoiceDate.toISOString() : ''}
          />
          <input
            type="hidden"
            name="dueDate"
            value={dueDate ? dueDate.toISOString() : ''}
          />

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {/* Invoice Type */}
            <div className="space-y-2">
              <Label>Invoice Type *</Label>
              <Select
                value={type}
                onValueChange={(value: 'purchase' | 'sale') => setType(value)}
                disabled={isViewMode}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sale">Sale Invoice</SelectItem>
                  <SelectItem value="purchase">Purchase Invoice</SelectItem>
                </SelectContent>
              </Select>
              {actionData?.fieldErrors?.type && (
                <p className="text-destructive text-xs">
                  {actionData.fieldErrors.type[0]}
                </p>
              )}
            </div>

            {/* Company */}
            <div className="space-y-2">
              <Label>Company *</Label>
              <Combobox
                options={companyOptions}
                value={companyId}
                onValueChange={setCompanyId}
                placeholder="Select company..."
                searchPlaceholder="Search companies..."
                emptyMessage="No companies found."
                disabled={isViewMode}
              />
              {actionData?.fieldErrors?.companyId && (
                <p className="text-destructive text-xs">
                  {actionData.fieldErrors.companyId[0]}
                </p>
              )}
            </div>

            {/* Business Partner */}
            <div className="space-y-2">
              <Label>
                {type === 'sale' ? 'Customer' : 'Vendor'} *
              </Label>
              <Combobox
                options={partnerOptions}
                value={businessPartnerId}
                onValueChange={setBusinessPartnerId}
                placeholder={`Select ${type === 'sale' ? 'customer' : 'vendor'}...`}
                searchPlaceholder="Search by name or NIT..."
                emptyMessage="No business partners found."
                disabled={isViewMode}
              />
              {actionData?.fieldErrors?.businessPartnerId && (
                <p className="text-destructive text-xs">
                  {actionData.fieldErrors.businessPartnerId[0]}
                </p>
              )}
            </div>

            {/* Accounting Account */}
            <div className="space-y-2">
              <Label>
                {type === 'sale' ? 'Revenue Account' : 'Expense Account'} *
              </Label>
              <Combobox
                options={accountOptions}
                value={accountingAccountId}
                onValueChange={setAccountingAccountId}
                placeholder="Select account..."
                searchPlaceholder="Search accounts..."
                emptyMessage="No accounts found."
                disabled={isViewMode}
              />
              {actionData?.fieldErrors?.accountingAccountId && (
                <p className="text-destructive text-xs">
                  {actionData.fieldErrors.accountingAccountId[0]}
                </p>
              )}
            </div>

            {/* Sucursal */}
            {sucursales.length > 0 && (
              <div className="space-y-2">
                <Label>Sucursal *</Label>
                <Combobox
                  options={sucursalOptions}
                  value={sucursalId}
                  onValueChange={setSucursalId}
                  placeholder="Seleccionar sucursal..."
                  searchPlaceholder="Buscar sucursal..."
                  emptyMessage="No se encontraron sucursales."
                  disabled={isViewMode}
                />
                {actionData?.fieldErrors?.sucursalId && (
                  <p className="text-destructive text-xs">
                    {actionData.fieldErrors.sucursalId[0]}
                  </p>
                )}
              </div>
            )}

            {/* Invoice Date */}
            <div className="space-y-2">
              <Label>Invoice Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !invoiceDate && 'text-muted-foreground'
                    )}
                    disabled={isViewMode}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {invoiceDate ? format(invoiceDate, 'PPP') : 'Select date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={invoiceDate}
                    onSelect={setInvoiceDate}
                  />
                </PopoverContent>
              </Popover>
              {actionData?.fieldErrors?.invoiceDate && (
                <p className="text-destructive text-xs">
                  {actionData.fieldErrors.invoiceDate[0]}
                </p>
              )}
            </div>

            {/* Due Date */}
            <div className="space-y-2">
              <Label>Due Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !dueDate && 'text-muted-foreground'
                    )}
                    disabled={isViewMode}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dueDate ? format(dueDate, 'PPP') : 'Select date (optional)'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dueDate}
                    onSelect={setDueDate}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Invoice Number (view mode only) */}
            {isViewMode && initialData?.number && (
              <div className="space-y-2">
                <Label>Invoice Number</Label>
                <Input value={initialData.number} disabled />
              </div>
            )}

            {/* Serie (view mode only) */}
            {isViewMode && initialData?.serie && (
              <div className="space-y-2">
                <Label>Serie</Label>
                <Input value={initialData.serie} disabled />
              </div>
            )}

            {/* Authorization Number (view mode only) */}
            {isViewMode && initialData?.authorizationNumber && (
              <div className="space-y-2">
                <Label>Authorization Number</Label>
                <Input value={initialData.authorizationNumber} disabled />
              </div>
            )}
          </div>

          {/* Actions (only in create mode) */}
          {mode === 'create' && (
            <div className="mt-6 flex items-center justify-end gap-4">
              <Button type="button" variant="outline" asChild>
                <Link to="/invoices">Cancel</Link>
              </Button>
              <Button
                type="submit"
                disabled={
                  isSubmitting || !companyId || !businessPartnerId || !accountingAccountId || !invoiceDate ||
                  (sucursales.length > 0 && !sucursalId)
                }
              >
                {isSubmitting ? 'Creating...' : 'Create Draft Invoice'}
              </Button>
            </div>
          )}
        </Form>
      </CardContent>
    </Card>
  )
}
