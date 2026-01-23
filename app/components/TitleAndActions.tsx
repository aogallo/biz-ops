import type { PropsWithChildren } from 'react'

interface TitleAndActionsProps extends PropsWithChildren {
  title: string
  subtitle?: string
}
const TitleAndActions = ({
  title,
  subtitle,
  children,
}: TitleAndActionsProps) => {
  return (
    <div className='mb-8 flex flex-wrap items-start justify-between gap-3'>
      <div className='flex flex-col gap-1'>
        <h1 className='text-2xl font-bold'>{title}</h1>
        {subtitle && <p className='text-muted-foreground'>{subtitle}</p>}
      </div>

      {children}
    </div>
  )
}

export default TitleAndActions
