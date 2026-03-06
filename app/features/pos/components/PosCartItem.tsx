import { Minus, Plus, Trash2 } from 'lucide-react'
import { Button } from '~/components/ui/button'
import { cn } from '~/lib/utils'
import { useTranslation } from '~/i18n/context'
import type { CartItem } from '../types'
import { calculateLineTotals } from '../types'

interface PosCartItemProps {
  item: CartItem
  onQuantityChange: (cartItemId: string, quantity: number) => void
  onRemove: (cartItemId: string) => void
  isSelected?: boolean
  onSelect?: (cartItemId: string) => void
}

export function PosCartItem({
  item,
  onQuantityChange,
  onRemove,
  isSelected,
  onSelect,
}: PosCartItemProps) {
  const { t } = useTranslation()
  const { total } = calculateLineTotals(item)

  const attrEntries = item.selectedAttributes
    ? Object.entries(item.selectedAttributes)
    : []

  return (
    <div
      className={cn(
        'flex items-center gap-2 border-b py-2 cursor-pointer rounded-sm px-1 -mx-1 transition-colors',
        isSelected && 'bg-primary/10'
      )}
      onClick={() => onSelect?.(item.cartItemId)}
    >
      <div className='min-w-0 flex-1'>
        <p className='truncate text-sm font-medium'>{item.productName}</p>
        {attrEntries.length > 0 && (
          <p className='text-muted-foreground truncate text-xs'>
            {attrEntries.map(([, v]) => v).join(' · ')}
          </p>
        )}
        <p className='text-muted-foreground text-xs'>
          Q{item.unitPrice.toFixed(2)} {t('pos.perUnit')}
        </p>
      </div>
      <div className='flex items-center gap-1'>
        <Button
          variant='outline'
          size='icon-xs'
          onClick={(e) => {
            e.stopPropagation()
            onQuantityChange(item.cartItemId, Math.max(1, item.quantity - 1))
          }}
        >
          <Minus />
        </Button>
        <span className='w-8 text-center text-sm tabular-nums'>
          {item.quantity}
        </span>
        <Button
          variant='outline'
          size='icon-xs'
          onClick={(e) => {
            e.stopPropagation()
            const max =
              item.productType === 'STOCK' && item.stock !== null
                ? item.stock
                : Infinity
            if (item.quantity < max) {
              onQuantityChange(item.cartItemId, item.quantity + 1)
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
        onClick={(e) => {
          e.stopPropagation()
          onRemove(item.cartItemId)
        }}
      >
        <Trash2 />
      </Button>
    </div>
  )
}
