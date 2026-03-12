import { Card, CardContent, CardHeader } from '~/components/ui/card'
import { Skeleton } from '~/components/ui/skeleton'

interface CardSkeletonProps {
  showHeader?: boolean
  lines?: number
}

export function CardSkeleton({
  showHeader = true,
  lines = 3,
}: CardSkeletonProps) {
  return (
    <Card>
      {showHeader && (
        <CardHeader>
          <Skeleton className='h-5 w-32' />
          <Skeleton className='h-4 w-48' />
        </CardHeader>
      )}
      <CardContent className='space-y-3'>
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton
            key={i}
            className='h-4'
            style={{ width: `${100 - i * 15}%` }}
          />
        ))}
      </CardContent>
    </Card>
  )
}
