import type { Row } from '@tanstack/react-table'
import { Eye, SquarePenIcon } from 'lucide-react'
import { Link } from 'react-router'
import { useCanPerformAction } from '~/hooks/usePermissions'

interface RowOperationsProps<TData> {
  row: Row<TData>
}

export default function RowOperations<TData extends { id: string }>({
  row,
}: RowOperationsProps<TData>) {
  const { id } = row.original

  const canEditCompany = useCanPerformAction('company.edit')
  return (
    <div className='flex items-center justify-center gap-2'>
      <Link to={`/company/${id}`}>
        <Eye />
      </Link>
      {canEditCompany && (
        <Link to={`/company/${id}/edit`}>
          <SquarePenIcon />
        </Link>
      )}
    </div>
  )
}
