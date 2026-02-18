import type { ColumnDef } from '@tanstack/react-table'
import { Badge } from '~/components/ui/badge'
import { Link } from 'react-router'
import { Eye } from 'lucide-react'
import { Button } from '~/components/ui/button'

export interface QuotationRow {
  id: string
  quotationNumber: string
  status: string
  quotationDate: string
  businessPartnerName: string | null
  companyName: string | null
  itemCount: number
  convertedOrderId: string | null
  createdAt: Date
}

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  DRAFT: { label: 'Draft', variant: 'secondary' },
  SENT: { label: 'Sent', variant: 'default' },
  ACCEPTED: { label: 'Accepted', variant: 'outline' },
  REJECTED: { label: 'Rejected', variant: 'destructive' },
}

export const quotationColumns: ColumnDef<QuotationRow>[] = [
  {
    accessorKey: 'quotationNumber',
    header: 'Quotation #',
    cell: ({ row }) => (
      <span className='font-mono text-sm font-medium'>
        {row.original.quotationNumber}
      </span>
    ),
  },
  {
    accessorKey: 'businessPartnerName',
    header: 'Business Partner',
    cell: ({ row }) => row.original.businessPartnerName ?? '-',
  },
  {
    accessorKey: 'companyName',
    header: 'Company',
    cell: ({ row }) => row.original.companyName ?? '-',
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const config = statusConfig[row.original.status] ?? {
        label: row.original.status,
        variant: 'secondary' as const,
      }
      return <Badge variant={config.variant}>{config.label}</Badge>
    },
  },
  {
    accessorKey: 'quotationDate',
    header: 'Date',
    cell: ({ row }) => new Date(row.original.quotationDate).toLocaleDateString(),
  },
  {
    accessorKey: 'itemCount',
    header: 'Items',
    cell: ({ row }) => row.original.itemCount,
  },
  {
    id: 'actions',
    header: '',
    size: 10,
    cell: ({ row }) => (
      <Link to={`/purchase/quotations/${row.original.id}`}>
        <Button variant='ghost' size='sm'>
          <Eye className='h-4 w-4' />
        </Button>
      </Link>
    ),
  },
]
