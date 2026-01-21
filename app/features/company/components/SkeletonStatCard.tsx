import { Card, CardContent } from '~/components/ui/card'
import { Skeleton } from '~/components/ui/skeleton'

const SkeletonStatCard = () => {
  return (
    <Card className='relative overflow-hidden'>
      <div className='bg-muted absolute top-0 left-0 h-full w-1' />
      <CardContent className='flex flex-col gap-3 pt-6'>
        <Skeleton className='h-3 w-24' />
        <Skeleton className='h-7 w-20' />
        <Skeleton className='h-3 w-16' />
        <Skeleton className='h-1 w-full' />
      </CardContent>
    </Card>
  )
}

export default SkeletonStatCard
