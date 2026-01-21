import { cn } from '~/lib/utils'

interface CircularProgressProps {
  value: number
  max?: number
  size?: number
  strokeWidth?: number
  className?: string
}

const CircularProgress = ({
  value,
  max = 100,
  size = 80,
  strokeWidth = 6,
  className,
}: CircularProgressProps) => {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const progress = Math.min(value / max, 1)
  const strokeDashoffset = circumference - progress * circumference

  return (
    <svg
      width={size}
      height={size}
      className={cn('rotate-[-90deg]', className)}
    >
      {/* Background circle */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill='none'
        stroke='currentColor'
        strokeWidth={strokeWidth}
        className='text-cyan-200'
      />
      {/* Progress arc */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill='none'
        stroke='currentColor'
        strokeWidth={strokeWidth}
        strokeLinecap='round'
        strokeDasharray={circumference}
        strokeDashoffset={strokeDashoffset}
        className='text-cyan-500 transition-all duration-500'
      />
    </svg>
  )
}

export default CircularProgress
