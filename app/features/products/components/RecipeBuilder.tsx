import { useState } from 'react'
import { useFetcher } from 'react-router'
import { Plus, Trash2, ChefHat } from 'lucide-react'
import { Button } from '~/components/ui/button'

interface RecipeItem {
  id: string
  ingredientProductId: string
  quantity: number
}

interface RecipeBuilderProps {
  productSku: string
  recipeData: {
    items: Array<{
      ingredientProductId: string
      quantity: string | number
    }>
  } | null
  ingredientProducts: Array<{ id: string; name: string; sku: string }>
}

export function RecipeBuilder({
  productSku,
  recipeData,
  ingredientProducts,
}: RecipeBuilderProps) {
  const fetcher = useFetcher()
  const [rows, setRows] = useState<RecipeItem[]>(
    recipeData?.items.map((item) => ({
      id: crypto.randomUUID(),
      ingredientProductId: item.ingredientProductId,
      quantity: Number(item.quantity),
    })) ?? []
  )

  function addRow() {
    setRows((prev) => [
      ...prev,
      { id: crypto.randomUUID(), ingredientProductId: '', quantity: 1 },
    ])
  }

  function removeRow(id: string) {
    setRows((prev) => prev.filter((r) => r.id !== id))
  }

  function updateRow(id: string, patch: Partial<RecipeItem>) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)))
  }

  function handleSave() {
    const validRows = rows.filter((r) => r.ingredientProductId && r.quantity > 0)
    fetcher.submit(
      {
        _intent: 'upsert-recipe',
        items: JSON.stringify(
          validRows.map((r) => ({
            ingredientProductId: r.ingredientProductId,
            quantity: r.quantity,
          }))
        ),
      },
      { method: 'post', action: `/products/${productSku}/edit` }
    )
  }

  const isSaving = fetcher.state !== 'idle'

  return (
    <section className='rounded-xl bg-card p-6 shadow-sm'>
      <div className='mb-5 flex items-center justify-between'>
        <div className='flex items-center gap-2'>
          <ChefHat className='h-4 w-4 text-amber-500' />
          <div>
            <h2 className='font-semibold'>Ingredientes de la receta</h2>
            <p className='text-muted-foreground text-xs'>
              Ingredientes que se descuentan del inventario al vender este producto
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

      {fetcher.data?.message && (
        <div
          className={`mb-4 rounded-md p-3 text-sm ${
            fetcher.data.success
              ? 'bg-green-500/10 text-green-700 dark:text-green-400'
              : 'bg-destructive/10 text-destructive'
          }`}
        >
          {fetcher.data.message}
        </div>
      )}

      {rows.length === 0 ? (
        <div className='rounded-lg border border-dashed border-border/50 p-6 text-center'>
          <p className='text-muted-foreground text-sm'>
            Sin ingredientes. Agregá los componentes de esta receta.
          </p>
        </div>
      ) : (
        <div className='overflow-hidden rounded-lg border border-border/50'>
          <table className='w-full text-sm'>
            <thead>
              <tr className='border-b border-border/50 bg-muted/40'>
                <th className='px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground'>
                  Ingrediente
                </th>
                <th className='px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground'>
                  Cantidad
                </th>
                <th className='px-4 py-2.5 text-right text-xs font-medium uppercase tracking-wide text-muted-foreground'>
                  Acción
                </th>
              </tr>
            </thead>
            <tbody className='divide-y divide-border/30'>
              {rows.map((row) => (
                <tr key={row.id} className='group'>
                  <td className='px-4 py-3'>
                    <select
                      value={row.ingredientProductId}
                      onChange={(e) =>
                        updateRow(row.id, { ingredientProductId: e.target.value })
                      }
                      className='w-full rounded-md border border-input bg-background px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring'
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
                      className='w-28 rounded-md border border-input bg-background px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring'
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

      <div className='mt-4 flex justify-end'>
        <Button
          type='button'
          onClick={handleSave}
          disabled={isSaving || rows.length === 0}
          className='gap-2'
        >
          {isSaving ? 'Guardando...' : 'Guardar receta'}
        </Button>
      </div>
    </section>
  )
}
