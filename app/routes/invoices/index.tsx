import type { ColumnDef } from '@tanstack/react-table'
import { format } from 'date-fns'
import { Eye, Plus } from 'lucide-react'
import { useMemo } from 'react'
import { Link, useSearchParams } from 'react-router'
import { DataTable } from '~/components/dataTable/DataTable'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card'
import { Combobox } from '~/components/ui/combobox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'
import { companyRepository } from '~/features/company/server/repository/company.repository'
import {
  invoiceRepository,
  type InvoiceWithLines,
} from '~/features/invoice/server/repository'
import { requireAuth } from '~/server/auth/session.server'
import type { Route } from './+types'

export async function loader({ request }: Route.LoaderArgs) {
  const session = await requireAuth(request)
  const url = new URL(request.url)

  if (!session.session.activeOrganizationId) {
    return {
      invoices: [],
      companies: [],
      total: 0,
    }
  }

  const organizationId = session.session.activeOrganizationId
  const companyId = url.searchParams.get('companyId') || undefined
  const type = url.searchParams.get('type') as 'purchase' | 'sale' | undefined
  const status = url.searchParams.get('status') as
    | 'draft'
    | 'pending'
    | 'posted'
    | 'voided'
    | undefined

  const [{ invoices, total }, companies] = await Promise.all([
    invoiceRepository.getPaginated(organizationId, { companyId, type, status }),
    companyRepository.getByOrganization(organizationId),
  ])

  return {
    invoices,
    companies,
    total,
  }
}

function getTypeBadge(type: string) {
  switch (type) {
    case 'sale':
      return (
        <Badge variant="outline" className="border-blue-500 text-blue-600">
          Sale
        </Badge>
      )
    case 'purchase':
      return (
        <Badge variant="outline" className="border-orange-500 text-orange-600">
          Purchase
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

export default function InvoicesIndex({ loaderData }: Route.ComponentProps) {
  const { invoices, companies } = loaderData
  const [searchParams, setSearchParams] = useSearchParams()

  const handleCompanyChange = (value: string) => {
    const params = new URLSearchParams(searchParams)
    if (value && value !== 'all') {
      params.set('companyId', value)
    } else {
      params.delete('companyId')
    }
    setSearchParams(params)
  }

  const handleTypeChange = (value: string) => {
    const params = new URLSearchParams(searchParams)
    if (value && value !== 'all') {
      params.set('type', value)
    } else {
      params.delete('type')
    }
    setSearchParams(params)
  }

  const handleStatusChange = (value: string) => {
    const params = new URLSearchParams(searchParams)
    if (value && value !== 'all') {
      params.set('status', value)
    } else {
      params.delete('status')
    }
    setSearchParams(params)
  }

  const columns = useMemo<ColumnDef<InvoiceWithLines>[]>(
    () => [
      {
        accessorKey: 'number',
        header: 'Invoice #',
        cell: ({ row }) => (
          <span className="font-medium">{row.getValue('number')}</span>
        ),
      },
      {
        accessorKey: 'type',
        header: 'Type',
        cell: ({ row }) => getTypeBadge(row.getValue('type')),
      },
      {
        accessorKey: 'invoiceDate',
        header: 'Date',
        cell: ({ row }) => {
          const date = row.getValue('invoiceDate') as Date
          return <div>{format(new Date(date), 'dd/MM/yyyy')}</div>
        },
      },
      {
        accessorKey: 'businessPartner',
        header: 'Business Partner',
        cell: ({ row }) => {
          const partner = row.original.businessPartner
          return <div className="max-w-40 truncate">{partner?.name || '-'}</div>
        },
      },
      {
        accessorKey: 'company',
        header: 'Company',
        cell: ({ row }) => {
          const company = row.original.company
          return <div>{company?.name || '-'}</div>
        },
      },
      {
        accessorKey: 'total',
        header: () => <div className="text-right">Total</div>,
        cell: ({ row }) => {
          const total = row.getValue('total') as string | number
          return (
            <div className="text-right font-mono">
              Q {Number(total).toFixed(2)}
            </div>
          )
        },
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => getStatusBadge(row.getValue('status')),
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <Button variant="ghost" size="icon" asChild>
            <Link to={`/invoices/${row.original.id}`}>
              <Eye className="h-4 w-4" />
            </Link>
          </Button>
        ),
      },
    ],
    []
  )

  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Invoices</CardTitle>
              <CardDescription>
                View and manage invoices
              </CardDescription>
            </div>
            <Button asChild>
              <Link to="/invoices/new">
                <Plus className="mr-2 h-4 w-4" />
                New Invoice
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="mb-4 flex flex-wrap items-center gap-4">
            <Combobox
              value={searchParams.get('companyId') || 'all'}
              onValueChange={handleCompanyChange}
              options={[
                { value: 'all', label: 'All Companies' },
                ...companies.map((company) => ({
                  value: company.id,
                  label: company.name,
                })),
              ]}
              placeholder="All Companies"
              searchPlaceholder="Search companies..."
              emptyMessage="No companies found."
              className="w-48"
            />

            <Select
              value={searchParams.get('type') || 'all'}
              onValueChange={handleTypeChange}
            >
              <SelectTrigger className="w-36">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="sale">Sales</SelectItem>
                <SelectItem value="purchase">Purchases</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={searchParams.get('status') || 'all'}
              onValueChange={handleStatusChange}
            >
              <SelectTrigger className="w-36">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="posted">Posted</SelectItem>
                <SelectItem value="voided">Voided</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {invoices.length === 0 ? (
            <div className="text-muted-foreground py-8 text-center">
              No invoices found
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={invoices}
              enableSearch
              searchPlaceholder="Search invoices..."
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
