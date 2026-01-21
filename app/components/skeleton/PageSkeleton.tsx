import { Card, CardContent } from '~/components/ui/card'
import { PageHeaderSkeleton } from './PageHeaderSkeleton'
import { TableSkeleton } from './TableSkeleton'

export function PageSkeleton() {
  return (
    <div className='space-y-6'>
      <span className='sr-only'>Loading page content...</span>

      {/* Page Header Skeleton */}
      <PageHeaderSkeleton />

      {/* Card with Table Skeleton */}
      <Card>
        <CardContent className='p-6'>
          <TableSkeleton rows={5} columns={4} />
        </CardContent>
      </Card>
    </div>
  )
}
