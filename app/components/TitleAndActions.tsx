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
    <div className='mb-6 flex items-center justify-between'>
      <div>
        <h1 className='text-2xl font-bold'>{title}</h1>
        {subtitle && <p className='text-muted-foreground'>{subtitle}</p>}
      </div>
      {children}
    </div>
  )
}

export default TitleAndActions
