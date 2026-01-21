import type { ColumnDef } from '@tanstack/react-table'
import { SquarePenIcon } from 'lucide-react'
import { Link } from 'react-router'
import type { Company } from '../schema'

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
    cell: ({ row }) => {
      const id = row.getValue('id')
      return (
        <div className='flex'>
          <Link to={`/company/${id}/edit`}>
            <button className=''>
              <SquarePenIcon />
            </button>
          </Link>
        </div>
      )
    },
  },
]
