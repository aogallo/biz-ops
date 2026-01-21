import { cva, type VariantProps } from 'class-variance-authority'
import type { ReactNode } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { cn } from '~/lib/utils'
import Trend, { type TrendDirection } from './Trend'

const statHeaderSize = cva('', {
  variants: {
    size: {
      default: 'text-xs',
      sm: 'text-[11px]',
    },
  },
  defaultVariants: {
    size: 'default',
  },
})

const statContentSize = cva('flex flex-col', {
  variants: {
    size: {
      default: 'gap-3 pt-6',
      sm: 'gap-1 pt-2',
    },
  },
  defaultVariants: {
    size: 'default',
  },
})

const statProgressSize = cva('', {
  variants: {
    size: {
      default: 'mt-3 h-1',
      sm: 'mt-2 h-1',
    },
  },
  defaultVariants: {
    size: 'default',
  },
})

const statVariants = cva('', {
  variants: {
    variant: {
      default: 'bg-sky-600',
      success: 'bg-green-600',
      warning: 'bg-orange-600',
      danger: 'bg-rose-600',
      purple: 'bg-purple-600',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
})

interface StatCardProps
  extends
    VariantProps<typeof statVariants>,
    VariantProps<typeof statContentSize> {
  title: string
  value: number
  progress?: number
  trendDirection?: TrendDirection
  isPercentage?: boolean
  className?: string
  children?: ReactNode
}

const StatCard = ({
  title,
  value,
  progress,
  trendDirection = 'neutral',
  isPercentage = false,
  variant,
  size,
  className,
  children,
}: StatCardProps) => {
  const isSmall = size === 'sm'

  return (
    <Card
      className={cn(
        'relative overflow-hidden',
        isSmall && 'gap-2 py-3',
        className
      )}
    >
      {/* Accent */}
      <div
        className={cn(
          'absolute top-0 left-0 h-full w-1',
          statVariants({ variant })
        )}
      />

      <CardHeader className={cn(isSmall && 'px-4')}>
        <CardTitle
          className={cn(
            'text-muted-foreground m-0 text-xs font-bold tracking-wider uppercase',
            statHeaderSize({ size })
          )}
        >
          {title}
        </CardTitle>
      </CardHeader>

      <CardContent className={cn(statContentSize({ size }), isSmall && 'px-4')}>
        <Trend
          value={value}
          direction={trendDirection}
          isPercentage={isPercentage}
        />

        {children}

        {progress !== undefined && (
          <div
            className={cn(
              'bg-muted w-full overflow-hidden rounded-full',
              statProgressSize({ size })
            )}
          >
            <div
              className={cn(
                'h-full rounded-full transition-all',
                statVariants({ variant })
              )}
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default StatCard
