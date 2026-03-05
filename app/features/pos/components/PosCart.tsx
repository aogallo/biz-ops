import { ShoppingCart } from 'lucide-react'
import { Button } from '~/components/ui/button'
import { Separator } from '~/components/ui/separator'
import { useTranslation } from '~/i18n/context'
import type { CartItem, CartTotals } from '../types'
import { PosCartItem } from './PosCartItem'

interface PosCartProps {
  items: CartItem[]
  totals: CartTotals
  onQuantityChange: (productId: string, quantity: number) => void
  onRemoveItem: (productId: string) => void
  onCheckout: () => void
}

export function PosCart({
  items,
  totals,
  onQuantityChange,
  onRemoveItem,
  onCheckout,
}: PosCartProps) {
  const { t } = useTranslation()

  return (
    <div className='flex h-full flex-col'>
      <div className='flex-1 overflow-y-auto px-4'>
        {items.length === 0 ? (
          <div className='text-muted-foreground flex flex-col items-center justify-center py-12'>
            <ShoppingCart className='mb-2 size-8' />
            <p className='text-sm'>{t('pos.emptyCart')}</p>
          </div>
        ) : (
          items.map((item) => (
            <PosCartItem
              key={item.productId}
              item={item}
              onQuantityChange={onQuantityChange}
              onRemove={onRemoveItem}
            />
          ))
        )}
      </div>

      <div className='mt-auto border-t px-4 pt-3 pb-4'>
        <div className='space-y-1 text-sm'>
          <div className='flex justify-between'>
            <span className='text-muted-foreground'>{t('pos.subtotal')}</span>
            <span className='tabular-nums'>Q{totals.subtotal.toFixed(2)}</span>
          </div>
          {totals.discountAmount > 0 && (
            <div className='flex justify-between'>
              <span className='text-muted-foreground'>{t('pos.discount')}</span>
              <span className='tabular-nums text-destructive'>
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
          disabled={items.length === 0}
        >
          {items.length > 0
            ? t('pos.checkoutWithCount', { count: items.length })
            : t('pos.checkout')}
        </Button>
      </div>
    </div>
  )
}
