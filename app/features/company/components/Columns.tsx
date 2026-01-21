import type { ColumnDef } from '@tanstack/react-table'
import type { Company } from '../schema'
import RowOperations from './RowOperations'

export const CompanyColumns: ColumnDef<Company>[] = [
  {
    accessorKey: 'name',
    header: 'Name',
  },
  {
    accessorKey: 'nit',
    header: 'NIT',
  },
  {
    id: 'operations',
    header: 'Operations',
    size: 10,
    cell: ({ row }) => <RowOperations row={row} />,
  },
]
