import type { ColumnDef } from '@tanstack/react-table'
import { Badge } from '~/components/ui/badge'
import { Link } from 'react-router'
import { Eye } from 'lucide-react'
import { Button } from '~/components/ui/button'

export interface OrderRow {
  id: string
  orderNumber: string
  status: string
  orderDate: string
  businessPartnerName: string | null
  companyName: string | null
  itemCount: number
  createdAt: Date
}

const statusConfig: Record<
  string,
  {
    label: string
    variant: 'default' | 'secondary' | 'destructive' | 'outline'
  }
> = {
  DRAFT: { label: 'Draft', variant: 'secondary' },
  CONFIRMED: { label: 'Confirmed', variant: 'default' },
  COMPLETED: { label: 'Completed', variant: 'outline' },
  CANCELLED: { label: 'Cancelled', variant: 'destructive' },
}

export const orderColumns: ColumnDef<OrderRow>[] = [
  {
    accessorKey: 'orderNumber',
    header: 'Order #',
    cell: ({ row }) => (
      <span className='font-mono text-sm font-medium'>
        {row.original.orderNumber}
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
    accessorKey: 'orderDate',
    header: 'Date',
    cell: ({ row }) => new Date(row.original.orderDate).toLocaleDateString(),
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
      <Link to={`/purchase/orders/${row.original.id}`}>
        <Button variant='ghost' size='sm'>
          <Eye className='h-4 w-4' />
        </Button>
      </Link>
    ),
  },
]
