import type { Row } from '@tanstack/react-table'
import { Eye, SquarePenIcon } from 'lucide-react'
import { Link } from 'react-router'
import { useCanPerformAction } from '~/hooks/usePermissions'

interface RowOperationsProps<TData> {
  row: Row<TData>
}

export default function RowOperations<TData>({
  row,
}: RowOperationsProps<TData>) {
  const id = row.getValue('id')
  const canEditCompany = useCanPerformAction('company.edit')
  return (
    <div className='flex items-center justify-center gap-2'>
      <Link to={`/company/${id}/show`}>
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
