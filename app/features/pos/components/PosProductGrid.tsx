import { cn } from '~/lib/utils'
import { useTranslation } from '~/i18n/context'
import type { PosProductForGrid } from '../types'

interface PosProductGridProps {
  products: PosProductForGrid[]
  categories: Array<{ id: string; name: string; color: string | null }>
  selectedCategoryId: string | null
  onCategoryChange: (categoryId: string | null) => void
  onProductClick: (product: PosProductForGrid) => void
  sucursalId?: string | null
}

export function PosProductGrid({
  products,
  categories,
  selectedCategoryId,
  onCategoryChange,
  onProductClick,
  sucursalId,
}: PosProductGridProps) {
  const { t } = useTranslation()

  return (
    <div className='flex flex-1 flex-col gap-3 overflow-hidden'>
      <div className='flex gap-1.5 overflow-x-auto pb-1'>
        <button
          type='button'
          onClick={() => onCategoryChange(null)}
          className={cn(
            'rounded-md px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-colors',
            !selectedCategoryId
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted hover:bg-muted/80'
          )}
        >
          {t('pos.allCategories')}
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            type='button'
            onClick={() => onCategoryChange(cat.id)}
            className={cn(
              'rounded-md px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-colors',
              selectedCategoryId === cat.id
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted hover:bg-muted/80'
            )}
          >
            {cat.name}
          </button>
        ))}
      </div>

      <div className='grid flex-1 auto-rows-min grid-cols-2 gap-2 overflow-y-auto sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4'>
        {products.map((product) => {
          const displayStock = sucursalId ? product.sucursalStock : product.stock
          const isOutOfStock =
            product.productType === 'STOCK' &&
            (displayStock === null || displayStock <= 0)
          const isLowStock =
            product.productType === 'STOCK' &&
            displayStock !== null &&
            displayStock > 0 &&
            displayStock <= 5

          return (
            <button
              key={product.id}
              type='button'
              onClick={() => !isOutOfStock && onProductClick(product)}
              disabled={isOutOfStock}
              className={cn(
                'bg-card hover:bg-accent flex flex-col items-center justify-center rounded-lg border p-3 text-center transition-colors',
                isOutOfStock && 'cursor-not-allowed opacity-50'
              )}
            >
              {product.imageUrl ? (
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className='mb-2 h-16 w-16 rounded-md object-cover'
                />
              ) : (
                <div className='bg-muted mb-2 flex h-16 w-16 items-center justify-center rounded-md'>
                  <span className='text-muted-foreground text-2xl'>📦</span>
                </div>
              )}
              <span className='line-clamp-2 text-sm font-medium'>
                {product.name}
              </span>
              <span className='text-primary mt-1 text-base font-bold'>
                Q{Number(product.price).toFixed(2)}
              </span>
              {product.productType === 'STOCK' && (
                <span
                  className={cn(
                    'mt-0.5 text-xs',
                    isLowStock
                      ? 'font-medium text-amber-600 dark:text-amber-400'
                      : 'text-muted-foreground'
                  )}
                >
                  {t('pos.stock')}: {displayStock ?? 0}
                  {isLowStock && ' ⚠'}
                </span>
              )}
            </button>
          )
        })}
        {products.length === 0 && (
          <div className='text-muted-foreground col-span-full py-12 text-center text-sm'>
            {t('pos.noProducts')}
          </div>
        )}
      </div>
    </div>
  )
}
