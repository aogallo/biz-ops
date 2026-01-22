import type { ColumnDef } from '@tanstack/react-table'
import { Checkbox } from '~/components/ui/checkbox'
import type { SatFile } from '~/server/db/schemas/sat-file'

export const SatFileColumns: ColumnDef<SatFile>[] = [
  {
    id: 'select',
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
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'date',
    header: 'Fecha Emision',
  },
  {
    accessorKey: 'serie',
    header: 'Serie/Document',
    cell: ({ row }) => {
      const serie = row.original.serie
      const dteNumber = row.original.dteNumber
      return `${serie}-${dteNumber}`
    },
  },
  {
    accessorKey: 'emitterNit',
    header: 'NIT Emisor',
  },
  {
    accessorKey: 'emitterName',
    header: 'Nombre Emisor',
  },
  {
    accessorKey: 'receptorNit',
    header: 'NIT Receptor',
  },
  {
    accessorKey: 'receptorName',
    header: 'Nombre Receptor',
  },
  {
    accessorKey: 'total',
    header: 'Total',
    cell: ({ row }) => {
      const total = row.original.total
      return `Q ${total.toFixed(2)}`
    },
  },
  {
    accessorKey: 'iva',
    header: 'IVA',
    cell: ({ row }) => {
      const iva = row.original.iva
      return `Q ${iva.toFixed(2)}`
    },
  },
  {
    accessorKey: 'accountingAccountId',
    header: 'Categoria Contable',
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
]
