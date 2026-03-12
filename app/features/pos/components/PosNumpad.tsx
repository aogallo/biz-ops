import { Delete } from 'lucide-react'
import { Button } from '~/components/ui/button'
import { cn } from '~/lib/utils'

interface PosNumpadProps {
  displayValue: string
  onDigit: (d: string) => void
  onBackspace: () => void
  onClear: () => void
  disabled: boolean
}

const KEYS = ['7', '8', '9', '4', '5', '6', '1', '2', '3'] as const

export function PosNumpad({
  displayValue,
  onDigit,
  onBackspace,
  onClear,
  disabled,
}: PosNumpadProps) {
  return (
    <div
      className={cn(
        'border-t px-4 pt-3 pb-2 select-none',
        disabled && 'pointer-events-none opacity-40'
      )}
    >
      {/* Display */}
      <div className='bg-muted mb-2 rounded-md px-3 py-2 text-right font-mono text-xl font-semibold tabular-nums'>
        {displayValue || '--'}
      </div>

      {/* Grid */}
      <div className='grid grid-cols-3 gap-1'>
        {KEYS.map((k) => (
          <Button
            key={k}
            variant='outline'
            className='h-10 text-base font-medium'
            onClick={() => onDigit(k)}
            disabled={disabled}
          >
            {k}
          </Button>
        ))}

        {/* Bottom row: ⌫ 0 C */}
        <Button
          variant='outline'
          className='h-10'
          onClick={onBackspace}
          disabled={disabled}
        >
          <Delete className='size-4' />
        </Button>
        <Button
          variant='outline'
          className='h-10 text-base font-medium'
          onClick={() => onDigit('0')}
          disabled={disabled}
        >
          0
        </Button>
        <Button
          variant='outline'
          className='text-destructive h-10 text-base font-medium'
          onClick={onClear}
          disabled={disabled}
        >
          C
        </Button>
      </div>
    </div>
  )
}
