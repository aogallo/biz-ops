import { useState } from 'react'
import { cn } from '~/lib/utils'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog'
import { Button } from '~/components/ui/button'
import type {
  PosProductForGrid,
  ProductAttribute,
  ProductAttributeValue,
} from '../types'

interface PosProductAttributesDialogProps {
  product: PosProductForGrid | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (
    product: PosProductForGrid,
    selectedAttributes: Record<string, string>,
    priceAdjustment: number
  ) => void
}

export function PosProductAttributesDialog({
  product,
  open,
  onOpenChange,
  onConfirm,
}: PosProductAttributesDialogProps) {
  const [selected, setSelected] = useState<Record<string, string>>({})

  if (!product) return null

  const attributes = product.attributesJson?.attributes ?? []

  const handleSelect = (attrKey: string, value: string) => {
    setSelected((prev) => ({ ...prev, [attrKey]: value }))
  }

  const totalPriceAdjustment = attributes.reduce((sum, attr) => {
    const selectedValue = selected[attr.key]
    if (!selectedValue) return sum
    const val = attr.values.find((v) => v.label === selectedValue)
    return sum + (val?.priceAdjustment ?? 0)
  }, 0)

  const allSelected = attributes.every((attr) => selected[attr.key])

  const handleConfirm = () => {
    if (!allSelected) return
    onConfirm(product, selected, totalPriceAdjustment)
    setSelected({})
    onOpenChange(false)
  }

  const handleDiscard = () => {
    setSelected({})
    onOpenChange(false)
  }

  const totalPrice = Number(product.price) + totalPriceAdjustment

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>
            {product.name}{' '}
            <span className='text-primary font-bold'>
              Q{totalPrice.toFixed(2)}
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className='space-y-5 py-2'>
          {attributes.map((attr) => (
            <AttributeSection
              key={attr.key}
              attr={attr}
              selectedValue={selected[attr.key]}
              onSelect={(val) => handleSelect(attr.key, val)}
            />
          ))}
        </div>

        <div className='flex gap-3 pt-2'>
          <Button
            className='flex-1'
            onClick={handleConfirm}
            disabled={!allSelected}
          >
            Añadir al carrito
          </Button>
          <Button variant='outline' className='flex-1' onClick={handleDiscard}>
            Descartar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function AttributeSection({
  attr,
  selectedValue,
  onSelect,
}: {
  attr: ProductAttribute
  selectedValue?: string
  onSelect: (val: string) => void
}) {
  return (
    <div>
      <p className='mb-2 text-sm font-semibold'>{attr.name}</p>
      <div className='flex flex-wrap gap-2'>
        {attr.values.map((val) => (
          <AttributeValueButton
            key={val.label}
            value={val}
            type={attr.type}
            isSelected={selectedValue === val.label}
            onSelect={() => onSelect(val.label)}
          />
        ))}
      </div>
    </div>
  )
}

function AttributeValueButton({
  value,
  type,
  isSelected,
  onSelect,
}: {
  value: ProductAttributeValue
  type: 'button' | 'color'
  isSelected: boolean
  onSelect: () => void
}) {
  if (type === 'color') {
    return (
      <button
        type='button'
        onClick={onSelect}
        title={value.label}
        className={cn(
          'h-9 w-9 rounded-full border-2 transition-all',
          isSelected
            ? 'border-primary scale-110 shadow-md'
            : 'hover:border-muted-foreground/50 border-transparent'
        )}
        style={{ backgroundColor: value.hex ?? '#ccc' }}
      />
    )
  }

  const hasAdjustment = value.priceAdjustment && value.priceAdjustment > 0

  return (
    <button
      type='button'
      onClick={onSelect}
      className={cn(
        'flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm font-medium transition-colors',
        isSelected
          ? 'bg-primary text-primary-foreground border-primary'
          : 'bg-background hover:bg-muted border-input'
      )}
    >
      {value.label}
      {hasAdjustment && (
        <span
          className={cn(
            'rounded-full px-1.5 py-0.5 text-xs font-semibold',
            isSelected
              ? 'bg-primary-foreground/20 text-primary-foreground'
              : 'bg-primary/10 text-primary'
          )}
        >
          +{value.priceAdjustment?.toFixed(2)} Q
        </span>
      )}
    </button>
  )
}
