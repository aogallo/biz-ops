import { ShoppingCart } from 'lucide-react'
import { Button } from '~/components/ui/button'
import { Separator } from '~/components/ui/separator'
import { useTranslation } from '~/i18n/context'
import type { CartItem, CartTotals } from '../types'
import { PosCartItem } from './PosCartItem'
import { PosNumpad } from './PosNumpad'

interface PosCartProps {
  items: CartItem[]
  totals: CartTotals
  onQuantityChange: (cartItemId: string, quantity: number) => void
  onRemoveItem: (cartItemId: string) => void
  onCheckout: () => void
  selectedItemId: string | null
  onItemSelect: (cartItemId: string) => void
  numpadInput: string
  onNumpadDigit: (d: string) => void
  onNumpadBackspace: () => void
  onNumpadClear: () => void
}

export function PosCart({
  items,
  totals,
  onQuantityChange,
  onRemoveItem,
  onCheckout,
  selectedItemId,
  onItemSelect,
  numpadInput,
  onNumpadDigit,
  onNumpadBackspace,
  onNumpadClear,
}: PosCartProps) {
  const { t } = useTranslation()

  const selectedItem = items.find((i) => i.cartItemId === selectedItemId)
  const numpadDisplay =
    numpadInput || (selectedItem ? String(selectedItem.quantity) : '')

  // Build ordered render list: for each non-combo_item line, render it + its children
  const renderItems: Array<{ item: CartItem; isComboChild: boolean }> = []
  const comboChildren = new Map<string, CartItem[]>()

  // First, group combo_item children by parentLineClientId
  for (const item of items) {
    if (item.lineType === 'combo_item' && item.parentLineClientId) {
      const existing = comboChildren.get(item.parentLineClientId) ?? []
      comboChildren.set(item.parentLineClientId, [...existing, item])
    }
  }

  // Then build the ordered list
  for (const item of items) {
    if (item.lineType === 'combo_item') continue // rendered inline below parent
    renderItems.push({ item, isComboChild: false })
    const children = comboChildren.get(item.cartItemId) ?? []
    for (const child of children) {
      renderItems.push({ item: child, isComboChild: true })
    }
  }

  // Count visible top-level items (excluding combo_item children)
  const topLevelCount = items.filter((i) => i.lineType !== 'combo_item').length

  return (
    <div className='flex h-full flex-col'>
      <div className='flex-1 overflow-y-auto px-4'>
        {renderItems.length === 0 ? (
          <div className='text-muted-foreground flex flex-col items-center justify-center py-12'>
            <ShoppingCart className='mb-2 size-8' />
            <p className='text-sm'>{t('pos.emptyCart')}</p>
          </div>
        ) : (
          renderItems.map(({ item, isComboChild }) => (
            <PosCartItem
              key={item.cartItemId}
              item={item}
              onQuantityChange={onQuantityChange}
              onRemove={onRemoveItem}
              isSelected={item.cartItemId === selectedItemId}
              onSelect={onItemSelect}
              isComboChild={isComboChild}
            />
          ))
        )}
      </div>

      <PosNumpad
        displayValue={numpadDisplay}
        onDigit={onNumpadDigit}
        onBackspace={onNumpadBackspace}
        onClear={onNumpadClear}
        disabled={selectedItemId === null || topLevelCount === 0}
      />

      <div className='mt-auto border-t px-4 pt-3 pb-4'>
        <div className='space-y-1 text-sm'>
          <div className='flex justify-between'>
            <span className='text-muted-foreground'>{t('pos.subtotal')}</span>
            <span className='tabular-nums'>Q{totals.subtotal.toFixed(2)}</span>
          </div>
          {totals.discountAmount > 0 && (
            <div className='flex justify-between'>
              <span className='text-muted-foreground'>{t('pos.discount')}</span>
              <span className='text-destructive tabular-nums'>
                -Q{totals.discountAmount.toFixed(2)}
              </span>
            </div>
          )}
          <div className='flex justify-between'>
            <span className='text-muted-foreground'>{t('pos.iva')}</span>
            <span className='tabular-nums'>Q{totals.ivaAmount.toFixed(2)}</span>
          </div>
          <Separator className='my-2' />
          <div className='flex justify-between text-lg font-bold'>
            <span>{t('pos.total')}</span>
            <span className='tabular-nums'>Q{totals.total.toFixed(2)}</span>
          </div>
        </div>

        <Button
          className='mt-3 h-12 w-full text-base font-semibold'
          onClick={onCheckout}
          disabled={topLevelCount === 0}
        >
          {topLevelCount > 0
            ? t('pos.checkoutWithCount', { count: String(topLevelCount) })
            : t('pos.checkout')}
        </Button>
      </div>
    </div>
  )
}
