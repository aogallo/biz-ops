import { useState } from 'react'
import { Switch } from '~/components/ui/switch'
import type { PosProductForGrid } from '../types'
import { Dialog, DialogContent, DialogTitle } from '~/components/ui/dialog'
import {
  Field,
  FieldContent,
  FieldGroup,
  FieldLabel,
  FieldTitle,
} from '~/components/ui/field'
import { DialogDescription } from '@radix-ui/react-dialog'
import { Button } from '~/components/ui/button'

interface PosProductRecipeDialogProps {
  product: PosProductForGrid | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (removedIngredientIds: string[]) => void
}

export function PosProductRecipeDialog({
  product,
  open,
  onOpenChange,
  onConfirm,
}: PosProductRecipeDialogProps) {
  const [removedIds, setRemovedIds] = useState<Set<string>>(new Set())

  if (!product || product.productType !== 'recipe') return null

  const optionalIngredients =
    product.recipeItems?.filter((i) => i.isOptional) ?? []

  function handleToggle(ingredientProductId: string) {
    setRemovedIds((prev) => {
      const next = new Set(prev)
      if (next.has(ingredientProductId)) {
        next.delete(ingredientProductId)
      } else {
        next.add(ingredientProductId)
      }
      return next
    })
  }

  function handleConfirm() {
    onConfirm(Array.from(removedIds))
    setRemovedIds(new Set())
  }

  function handleOpenChange(open: boolean) {
    if (!open) setRemovedIds(new Set())
    onOpenChange(open)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogTitle>{product.name}</DialogTitle>
        <DialogDescription>{product.categoryName}</DialogDescription>

        {optionalIngredients.length > 0 ? (
          <>
            {optionalIngredients.map((ingredient) => (
              <FieldGroup key={ingredient.id}>
                <FieldLabel htmlFor={ingredient.ingredientProductId}>
                  <Field orientation='horizontal'>
                    <FieldContent className='flex flex-row items-center gap-2'>
                      <Switch
                        id={ingredient.ingredientProductId}
                        checked={
                          !removedIds.has(ingredient.ingredientProductId)
                        }
                        onCheckedChange={() =>
                          handleToggle(ingredient.ingredientProductId)
                        }
                      />
                      <FieldTitle>{ingredient.name}</FieldTitle>
                    </FieldContent>
                  </Field>
                </FieldLabel>
              </FieldGroup>
            ))}
            <Button className='mt-2 w-full' onClick={handleConfirm}>
              Agregar
            </Button>
          </>
        ) : (
          <p className='text-muted-foreground text-sm'>
            No optional ingredients
          </p>
        )}
      </DialogContent>
    </Dialog>
  )
}
