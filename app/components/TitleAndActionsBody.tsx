import type { PropsWithChildren } from 'react'

const TitleAndActionsBody = ({ children }: PropsWithChildren) => {
  return <div className='flex gap-2.5'>{children}</div>
}

export default TitleAndActionsBody
