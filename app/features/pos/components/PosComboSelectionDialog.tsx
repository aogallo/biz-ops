import { useState, useCallback } from 'react'
import { Button } from '~/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog'
import { cn } from '~/lib/utils'
import type { CartItem, PosProductForGrid } from '../types'

export interface ComboGroupOption {
  id: string
  productId: string
  productName: string
  productSku: string
  isDefault: boolean
  priceAdjustment: number
  sortOrder: number
}

export interface ComboGroup {
  id: string
  name: string
  minSelect: number
  maxSelect: number
  isRequired: boolean
  sortOrder: number
  items: ComboGroupOption[]
}

export interface PosComboDefinition {
  comboId: string
  productId: string
  groups: ComboGroup[]
}

interface PosComboSelectionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  product: PosProductForGrid
  comboDef: PosComboDefinition
  onConfirm: (comboLine: CartItem, childLines: CartItem[]) => void
}

export function PosComboSelectionDialog({
  open,
  onOpenChange,
  product,
  comboDef,
  onConfirm,
}: PosComboSelectionDialogProps) {
  // Initialize selections with defaults
  const initSelections = useCallback(() => {
    const initial: Record<string, string[]> = {}
    for (const group of comboDef.groups) {
      const defaults = group.items
        .filter((i) => i.isDefault)
        .map((i) => i.productId)
      initial[group.id] = defaults.length > 0 ? defaults : [group.items[0]?.productId ?? '']
    }
    return initial
  }, [comboDef.groups])

  const [selections, setSelections] = useState<Record<string, string[]>>(initSelections)

  const handleSelect = (groupId: string, productId: string, maxSelect: number) => {
    setSelections((prev) => {
      const current = prev[groupId] ?? []
      if (maxSelect === 1) {
        // Single select: replace
        return { ...prev, [groupId]: [productId] }
      }
      // Multi select: toggle
      if (current.includes(productId)) {
        return { ...prev, [groupId]: current.filter((id) => id !== productId) }
      }
      if (current.length >= maxSelect) return prev
      return { ...prev, [groupId]: [...current, productId] }
    })
  }

  const isValid = comboDef.groups.every((group) => {
    const selected = selections[group.id] ?? []
    return !group.isRequired || selected.length >= group.minSelect
  })

  const getTotalPriceAdjustment = () => {
    let adjustment = 0
    for (const group of comboDef.groups) {
      const selected = selections[group.id] ?? []
      for (const item of group.items) {
        if (selected.includes(item.productId)) {
          adjustment += item.priceAdjustment
        }
      }
    }
    return adjustment
  }

  const handleConfirm = () => {
    if (!isValid) return

    const comboCartItemId = crypto.randomUUID()
    const totalAdjustment = getTotalPriceAdjustment()

    const comboLine: CartItem = {
      cartItemId: comboCartItemId,
      productId: product.id,
      productName: product.name,
      productSku: product.sku,
      unitPrice: Number(product.price) + totalAdjustment,
      quantity: 1,
      discountPercent: 0,
      ivaType: 'taxed',
      ivaRate: 12,
      productType: 'combo',
      trackInventory: false,
      stock: null,
      lineType: 'combo',
      comboTemplateId: product.id,
    }

    const childLines: CartItem[] = []
    for (const group of comboDef.groups) {
      const selected = selections[group.id] ?? []
      for (const item of group.items) {
        if (selected.includes(item.productId)) {
          childLines.push({
            cartItemId: crypto.randomUUID(),
            productId: item.productId,
            productName: item.productName,
            productSku: item.productSku,
            unitPrice: 0, // price absorbed in combo line
            quantity: 1,
            discountPercent: 0,
            ivaType: 'taxed',
            ivaRate: 12,
            productType: 'STOCK', // actual type resolved server-side
            trackInventory: true,
            stock: null,
            lineType: 'combo_item',
            parentLineClientId: comboCartItemId,
            comboTemplateId: product.id,
          })
        }
      }
    }

    onConfirm(comboLine, childLines)
  }

  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      setSelections(initSelections())
    }
    onOpenChange(isOpen)
  }

  const basePrice = Number(product.price)
  const adjustment = getTotalPriceAdjustment()
  const finalPrice = basePrice + adjustment

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className='sm:max-w-lg max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>{product.name}</DialogTitle>
          <p className='text-muted-foreground text-sm'>
            Personalizá tu combo
          </p>
        </DialogHeader>

        <div className='space-y-6'>
          {comboDef.groups.map((group) => (
            <div key={group.id}>
              <div className='mb-2 flex items-center justify-between'>
                <h4 className='font-medium'>
                  {group.name}
                  {group.isRequired && (
                    <span className='text-destructive ml-1'>*</span>
                  )}
                </h4>
                <span className='text-muted-foreground text-xs'>
                  {group.maxSelect === 1
                    ? 'Elegí 1'
                    : `Elegí hasta ${group.maxSelect}`}
                </span>
              </div>
              <div className='grid grid-cols-2 gap-2'>
                {group.items.map((item) => {
                  const selected = (selections[group.id] ?? []).includes(
                    item.productId
                  )
                  return (
                    <button
                      key={item.productId}
                      type='button'
                      onClick={() =>
                        handleSelect(group.id, item.productId, group.maxSelect)
                      }
                      className={cn(
                        'rounded-lg border p-3 text-left text-sm transition-colors',
                        selected
                          ? 'border-primary bg-primary/10'
                          : 'border-border hover:border-primary/50'
                      )}
                    >
                      <span className='block font-medium'>
                        {item.productName}
                      </span>
                      {item.priceAdjustment !== 0 && (
                        <span className='text-muted-foreground text-xs'>
                          {item.priceAdjustment > 0 ? '+' : ''}
                          Q{item.priceAdjustment.toFixed(2)}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        <DialogFooter className='mt-4'>
          <div className='mr-auto text-sm'>
            <span className='text-muted-foreground'>Total: </span>
            <span className='font-bold tabular-nums'>
              Q{finalPrice.toFixed(2)}
            </span>
          </div>
          <Button variant='outline' onClick={() => handleOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={!isValid}>
            Agregar al carrito
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
