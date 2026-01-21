import { TrendingDownIcon, TrendingUpIcon } from 'lucide-react'
import { cn } from '~/lib/utils'
import Currency from './Currency'
import Percentage from './Percentage'

export type TrendDirection = 'up' | 'down' | 'neutral'

interface TrendProps {
  value: number
  direction: TrendDirection
  isPercentage: boolean
  size?: 'default' | 'sm'
}

interface TrendValue {
  icon: typeof TrendingUpIcon | null
  className: string
  prefix: string
}

const trendConfig: Record<TrendDirection, TrendValue> = {
  up: {
    icon: TrendingUpIcon,
    className: 'text-green-600 dark:text-green-400',
    prefix: '+',
  },
  down: {
    icon: TrendingDownIcon,
    className: 'text-rose-600 dark:text-rose-400',
    prefix: '-',
  },
  neutral: {
    icon: null,
    className: 'text-muted-foreground',
    prefix: '',
  },
}
const trendValueSize = {
  default: 'text-2xl',
  sm: 'text-xl',
} as const

const Trend = ({
  value,
  direction,
  isPercentage,
  size = 'default',
}: TrendProps) => {
  const config = trendConfig[direction]
  const Icon = config.icon || null

  return (
    <div className='flex items-center gap-2'>
      <span
        className={cn('font-extrabold', config.className, trendValueSize[size])}
      >
        {config.prefix}
        {isPercentage ? (
          <Percentage value={value} />
        ) : (
          <Currency value={value} />
        )}
      </span>
      {Icon && <Icon className='h-4 w-4' />}
    </div>
  )
}

export default Trend
