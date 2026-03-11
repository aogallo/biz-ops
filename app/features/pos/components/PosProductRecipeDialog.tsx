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

interface PosProductRecipeDialogProps {
  product: PosProductForGrid | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function PosProductRecipeDialog({
  product,
  open,
  onOpenChange,
}: PosProductRecipeDialogProps) {
  if (!product || product.productType !== 'recipe') return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle>{product.name}</DialogTitle>
        <DialogDescription>{product.categoryName}</DialogDescription>
        {product.recipeItems?.map((ingredient) => (
          <FieldGroup key={ingredient.id}>
            <FieldLabel htmlFor={ingredient.name}>
              <Field orientation='horizontal'>
                <FieldContent className='flex flex-row'>
                  <Switch id={ingredient.name} checked={true} />
                  <FieldTitle>{ingredient.name}</FieldTitle>
                </FieldContent>
              </Field>
            </FieldLabel>
          </FieldGroup>
        ))}

        {product.recipeItems?.length === 0 && (
          <p className='text-muted-foreground text-sm'>
            No ingredients left 🍔
          </p>
        )}
      </DialogContent>
    </Dialog>
  )
}
