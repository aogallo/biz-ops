import { Skeleton } from '~/components/ui/skeleton'

export function PageHeaderSkeleton() {
  return (
    <div className='flex items-center justify-between'>
      <div className='space-y-2'>
        <Skeleton className='h-8 w-48' />
        <Skeleton className='h-4 w-64' />
      </div>
      <Skeleton className='h-10 w-32' />
    </div>
  )
}
