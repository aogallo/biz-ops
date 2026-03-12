import { Skeleton } from '~/components/ui/skeleton'

interface TableSkeletonProps {
  rows?: number
  columns?: number
}

export function TableSkeleton({ rows = 5, columns = 4 }: TableSkeletonProps) {
  return (
    <div className='w-full'>
      {/* Table Header */}
      <div className='flex gap-4 border-b pb-3'>
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={`header-${i}`} className='h-4 flex-1' />
        ))}
      </div>

      {/* Table Body */}
      <div className='divide-y'>
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={`row-${rowIndex}`} className='flex gap-4 py-4'>
            {Array.from({ length: columns }).map((_, colIndex) => (
              <Skeleton
                key={`cell-${rowIndex}-${colIndex}`}
                className='h-4 flex-1'
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
