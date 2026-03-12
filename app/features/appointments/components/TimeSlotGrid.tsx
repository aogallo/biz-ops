import { cn } from '~/lib/utils'
import { availableTimeSlots } from '../mock-data'

interface TimeSlotGridProps {
  selectedSlot: string | null
  onSelectSlot: (slot: string) => void
  unavailableSlots?: string[]
}

export function TimeSlotGrid({
  selectedSlot,
  onSelectSlot,
  unavailableSlots = [],
}: TimeSlotGridProps) {
  return (
    <div className='space-y-2'>
      <div className='grid grid-cols-3 gap-2'>
        {availableTimeSlots.map((slot) => {
          const isUnavailable = unavailableSlots.includes(slot)
          const isSelected = selectedSlot === slot

          return (
            <button
              key={slot}
              type='button'
              disabled={isUnavailable}
              onClick={() => onSelectSlot(slot)}
              className={cn(
                'rounded-md border px-3 py-2 text-sm font-medium transition-colors',
                isSelected
                  ? 'border-primary bg-primary text-primary-foreground'
                  : isUnavailable
                    ? 'border-muted bg-muted text-muted-foreground cursor-not-allowed opacity-50'
                    : 'border-border bg-background hover:border-primary hover:bg-accent'
              )}
            >
              {slot}
            </button>
          )
        })}
      </div>
      <div className='text-muted-foreground flex items-center gap-2 text-xs'>
        <div className='flex items-center gap-1'>
          <div className='border-primary bg-primary size-3 rounded border' />
          <span>Selected</span>
        </div>
        <div className='flex items-center gap-1'>
          <div className='border-border bg-background size-3 rounded border' />
          <span>Available</span>
        </div>
        <div className='flex items-center gap-1'>
          <div className='border-muted bg-muted size-3 rounded border opacity-50' />
          <span>Unavailable</span>
        </div>
      </div>
    </div>
  )
}
