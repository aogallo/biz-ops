import { type ColumnDef } from '@tanstack/react-table'
import { Eye } from 'lucide-react'
import { Link } from 'react-router'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { DataTable } from '~/components/dataTable/DataTable'
import { posRepository } from '~/features/pos/server/repository'
import { requireAuth } from '~/server/auth/session.server'
import { useTranslation } from '~/i18n/context'
import type { Route } from './+types/index'

interface SaleRow {
  id: string
  saleNumber: string
  status: string
  total: string
  currency: string
  createdAt: Date
  cashierName: string
  terminalName: string
  customerName: string
}

export async function loader({ request }: Route.LoaderArgs) {
  const session = await requireAuth(request)
  const organizationId = session.session.activeOrganizationId

  if (!organizationId) {
    return { sales: [], total: 0, page: 1, pageSize: 10 }
  }

  const url = new URL(request.url)
  const page = Number(url.searchParams.get('page') ?? '1')
  const pageSize = 10

  const { sales, total } = await posRepository.getSalesPaginated(
    organizationId,
    {
      limit: pageSize,
      offset: (page - 1) * pageSize,
    }
  )

  return { sales, total, page, pageSize }
}

export default function PosSalesIndex({ loaderData }: Route.ComponentProps) {
  const { sales } = loaderData
  const { t } = useTranslation()

  const columns: ColumnDef<SaleRow>[] = [
    {
      accessorKey: 'saleNumber',
      header: t('pos.saleNumber'),
    },
    {
      accessorKey: 'terminalName',
      header: t('pos.terminalCol'),
    },
    {
      accessorKey: 'cashierName',
      header: t('pos.cashierCol'),
    },
    {
      accessorKey: 'customerName',
      header: t('pos.customerCol'),
    },
    {
      accessorKey: 'total',
      header: t('pos.total'),
      cell: ({ row }) => (
        <span className='tabular-nums'>
          Q{Number(row.original.total).toFixed(2)}
        </span>
      ),
    },
    {
      accessorKey: 'status',
      header: t('pos.statusCol'),
      cell: ({ row }) => {
        const status = row.original.status
        return (
          <Badge
            variant={
              status === 'completed'
                ? 'default'
                : status === 'voided'
                  ? 'destructive'
                  : 'secondary'
            }
          >
            {status === 'completed'
              ? t('pos.completed')
              : status === 'voided'
                ? t('pos.voided')
                : t('pos.refunded')}
          </Badge>
        )
      },
    },
    {
      accessorKey: 'createdAt',
      header: t('pos.dateCol'),
      cell: ({ row }) =>
        new Date(row.original.createdAt).toLocaleString('es-GT', {
          dateStyle: 'short',
          timeStyle: 'short',
        }),
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <Button variant='ghost' size='icon-xs' asChild>
          <Link to={`/pos/sales/${row.original.id}`}>
            <Eye className='size-4' />
          </Link>
        </Button>
      ),
    },
  ]

  return (
    <div className='flex flex-1 flex-col p-6'>
      <div className='mb-4 flex items-center justify-between'>
        <h1 className='text-xl font-bold'>{t('pos.salesHistory')}</h1>
        <Button variant='outline' size='sm' asChild>
          <Link to='/pos'>{t('pos.backToPos')}</Link>
        </Button>
      </div>
      <DataTable columns={columns} data={sales} />
    </div>
  )
}
