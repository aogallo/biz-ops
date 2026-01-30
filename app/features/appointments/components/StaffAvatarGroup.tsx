import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar'
import { cn } from '~/lib/utils'
import type { Staff } from '../types'

interface StaffAvatarGroupProps {
  staff: Staff[]
  maxVisible?: number
  size?: 'sm' | 'md' | 'lg'
}

const sizeClasses = {
  sm: 'size-6',
  md: 'size-8',
  lg: 'size-10',
}

const overlapClasses = {
  sm: '-ml-2',
  md: '-ml-2.5',
  lg: '-ml-3',
}

export function StaffAvatarGroup({
  staff,
  maxVisible = 4,
  size = 'md',
}: StaffAvatarGroupProps) {
  const visibleStaff = staff.slice(0, maxVisible)
  const remainingCount = staff.length - maxVisible

  return (
    <div className="flex items-center">
      {visibleStaff.map((member, index) => (
        <Avatar
          key={member.id}
          className={cn(
            sizeClasses[size],
            'ring-2 ring-background',
            index > 0 && overlapClasses[size]
          )}
        >
          <AvatarImage src={member.image || undefined} alt={member.name} />
          <AvatarFallback className="text-xs">
            {member.name
              .split(' ')
              .map((n) => n[0])
              .join('')
              .toUpperCase()
              .slice(0, 2)}
          </AvatarFallback>
        </Avatar>
      ))}
      {remainingCount > 0 && (
        <div
          className={cn(
            sizeClasses[size],
            overlapClasses[size],
            'flex items-center justify-center rounded-full bg-muted text-xs font-medium ring-2 ring-background'
          )}
        >
          +{remainingCount}
        </div>
      )}
    </div>
  )
}
