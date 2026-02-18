import { Minus, Plus, Trash2 } from 'lucide-react'
import { Button } from '~/components/ui/button'
import type { CartItem } from '../types'
import { calculateLineTotals } from '../types'

interface PosCartItemProps {
  item: CartItem
  onQuantityChange: (productId: string, quantity: number) => void
  onRemove: (productId: string) => void
}

export function PosCartItem({
  item,
  onQuantityChange,
  onRemove,
}: PosCartItemProps) {
  const { total } = calculateLineTotals(item)

  return (
    <div className='flex items-center gap-2 border-b py-2'>
      <div className='min-w-0 flex-1'>
        <p className='truncate text-sm font-medium'>{item.productName}</p>
        <p className='text-muted-foreground text-xs'>
          Q{item.unitPrice.toFixed(2)} c/u
        </p>
      </div>
      <div className='flex items-center gap-1'>
        <Button
          variant='outline'
          size='icon-xs'
          onClick={() =>
            onQuantityChange(item.productId, Math.max(1, item.quantity - 1))
          }
        >
          <Minus />
        </Button>
        <span className='w-8 text-center text-sm tabular-nums'>
          {item.quantity}
        </span>
        <Button
          variant='outline'
          size='icon-xs'
          onClick={() => {
            const max =
              item.productType === 'STOCK' && item.stock !== null
                ? item.stock
                : Infinity
            if (item.quantity < max) {
              onQuantityChange(item.productId, item.quantity + 1)
            }
          }}
        >
          <Plus />
        </Button>
      </div>
      <span className='w-20 text-right text-sm font-medium tabular-nums'>
        Q{total.toFixed(2)}
      </span>
      <Button
        variant='ghost'
        size='icon-xs'
        className='text-destructive'
        onClick={() => onRemove(item.productId)}
      >
        <Trash2 />
      </Button>
    </div>
  )
}
