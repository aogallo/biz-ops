import { Plus, Trash2, ChefHat } from 'lucide-react'
import { Button } from '~/components/ui/button'

export interface RecipeRow {
  id: string
  ingredientProductId: string
  quantity: number
  isOptional: boolean
}

interface RecipeBuilderProps {
  rows: RecipeRow[]
  onChange: (rows: RecipeRow[]) => void
  ingredientProducts: Array<{ id: string; name: string; sku: string }>
}

export function RecipeBuilder({
  rows,
  onChange,
  ingredientProducts,
}: RecipeBuilderProps) {
  function addRow() {
    onChange([
      ...rows,
      {
        id: crypto.randomUUID(),
        ingredientProductId: '',
        quantity: 1,
        isOptional: false,
      },
    ])
  }

  function removeRow(id: string) {
    onChange(rows.filter((r) => r.id !== id))
  }

  function updateRow(id: string, patch: Partial<RecipeRow>) {
    onChange(rows.map((r) => (r.id === id ? { ...r, ...patch } : r)))
  }

  return (
    <section className='bg-card rounded-xl p-6 shadow-sm'>
      <div className='mb-5 flex items-center justify-between'>
        <div className='flex items-center gap-2'>
          <ChefHat className='h-4 w-4 text-amber-500' />
          <div>
            <h2 className='font-semibold'>Ingredientes de la receta</h2>
            <p className='text-muted-foreground text-xs'>
              Ingredientes que se descuentan del inventario al vender este
              producto
            </p>
          </div>
        </div>
        <Button
          type='button'
          variant='outline'
          size='sm'
          onClick={addRow}
          className='shrink-0 gap-1.5'
        >
          <Plus className='h-3.5 w-3.5' />
          Agregar ingrediente
        </Button>
      </div>

      {rows.length === 0 ? (
        <div className='border-border/50 rounded-lg border border-dashed p-6 text-center'>
          <p className='text-muted-foreground text-sm'>
            Sin ingredientes. Agregá los componentes de esta receta.
          </p>
        </div>
      ) : (
        <div className='border-border/50 overflow-hidden rounded-lg border'>
          <table className='w-full text-sm'>
            <thead>
              <tr className='border-border/50 bg-muted/40 border-b'>
                <th className='text-muted-foreground px-4 py-2.5 text-left text-xs font-medium tracking-wide uppercase'>
                  Ingrediente
                </th>
                <th className='text-muted-foreground px-4 py-2.5 text-left text-xs font-medium tracking-wide uppercase'>
                  Cantidad
                </th>
                <th className='text-muted-foreground px-4 py-2.5 text-center text-xs font-medium tracking-wide uppercase'>
                  Opcional
                </th>
                <th className='text-muted-foreground px-4 py-2.5 text-right text-xs font-medium tracking-wide uppercase'>
                  Acción
                </th>
              </tr>
            </thead>
            <tbody className='divide-border/30 divide-y'>
              {rows.map((row) => (
                <tr key={row.id} className='group'>
                  <td className='px-4 py-3'>
                    <select
                      value={row.ingredientProductId}
                      onChange={(e) =>
                        updateRow(row.id, {
                          ingredientProductId: e.target.value,
                        })
                      }
                      className='border-input bg-background focus:ring-ring w-full rounded-md border px-2.5 py-1.5 text-sm focus:ring-2 focus:outline-none'
                    >
                      <option value=''>Seleccionar ingrediente...</option>
                      {ingredientProducts.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.sku})
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className='px-4 py-3'>
                    <input
                      type='number'
                      value={row.quantity}
                      onChange={(e) =>
                        updateRow(row.id, { quantity: Number(e.target.value) })
                      }
                      min='0.001'
                      step='0.001'
                      className='border-input bg-background focus:ring-ring w-28 rounded-md border px-2.5 py-1.5 text-sm focus:ring-2 focus:outline-none'
                    />
                  </td>
                  <td className='px-4 py-3 text-center'>
                    <input
                      type='checkbox'
                      checked={row.isOptional}
                      onChange={(e) =>
                        updateRow(row.id, { isOptional: e.target.checked })
                      }
                      className='border-input h-4 w-4 cursor-pointer rounded accent-amber-500'
                    />
                  </td>
                  <td className='px-4 py-3 text-right'>
                    <button
                      type='button'
                      onClick={() => removeRow(row.id)}
                      className='text-muted-foreground hover:text-destructive rounded p-1 transition-colors'
                    >
                      <Trash2 className='h-4 w-4' />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
