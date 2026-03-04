import type { ColumnDef } from '@tanstack/react-table'
import { Checkbox } from '~/components/ui/checkbox'
import type { SatFile } from '~/server/db/schemas/sat-file'

export const SatFileColumns: ColumnDef<SatFile>[] = [
  {
    id: 'select',
    size: 40,
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && 'indeterminate')
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        onClick={(e) => e.stopPropagation()}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'date',
    header: 'Fecha Emision',
    size: 110,
  },
  {
    accessorKey: 'serie',
    header: 'Serie/Doc',
    size: 120,
    cell: ({ row }) => {
      const serie = row.original.serie
      const dteNumber = row.original.dteNumber
      return (
        <div className="max-w-[120px] truncate" title={`${serie}-${dteNumber}`}>
          {serie}-{dteNumber}
        </div>
      )
    },
  },
  {
    accessorKey: 'emitterNit',
    header: 'NIT Emisor',
    size: 110,
  },
  {
    accessorKey: 'emitterName',
    header: 'Emisor',
    size: 160,
    cell: ({ row }) => (
      <div className="max-w-[160px] truncate" title={row.original.emitterName ?? undefined}>
        {row.original.emitterName}
      </div>
    ),
  },
  {
    accessorKey: 'receptorNit',
    header: 'NIT Receptor',
    size: 110,
  },
  {
    accessorKey: 'receptorName',
    header: 'Receptor',
    size: 160,
    cell: ({ row }) => (
      <div className="max-w-[160px] truncate" title={row.original.receptorName ?? undefined}>
        {row.original.receptorName}
      </div>
    ),
  },
  {
    accessorKey: 'total',
    header: 'Total',
    size: 90,
    cell: ({ row }) => `Q ${row.original.total.toFixed(2)}`,
  },
  {
    accessorKey: 'iva',
    header: 'IVA',
    size: 80,
    cell: ({ row }) => `Q ${row.original.iva.toFixed(2)}`,
  },
  {
    accessorKey: 'accountingAccountId',
    header: 'Estado',
    size: 100,
    cell: ({ row }) => {
      const accountId = row.original.accountingAccountId
      if (accountId) {
        return (
          <span className="rounded bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900/30 dark:text-green-400">
            Asignado
          </span>
        )
      }
      return (
        <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
          Pendiente
        </span>
      )
    },
  },
  {
    accessorKey: 'itemType',
    header: 'Tipo',
    size: 90,
    cell: ({ row }) => {
      const itemType = row.original.itemType
      if (itemType === 'goods') {
        return (
          <span className="rounded bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
            Bien
          </span>
        )
      }
      if (itemType === 'services') {
        return (
          <span className="rounded bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-800 dark:bg-purple-900/30 dark:text-purple-400">
            Servicio
          </span>
        )
      }
      return (
        <span className="text-muted-foreground text-xs">—</span>
      )
    },
  },
]
