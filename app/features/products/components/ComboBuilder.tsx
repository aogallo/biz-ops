import { useState } from 'react'
import { useFetcher } from 'react-router'
import { Plus, Trash2, Layers } from 'lucide-react'
import { Button } from '~/components/ui/button'

interface ComboGroupItem {
  id: string
  productId: string
  isDefault: boolean
  priceAdjustment: number
  sortOrder: number
}

interface ComboGroup {
  id: string
  name: string
  minSelect: number
  maxSelect: number
  isRequired: boolean
  sortOrder: number
  items: ComboGroupItem[]
}

interface ComboBuilderProps {
  productSku: string
  comboData: {
    groups: Array<{
      id: string
      name: string
      minSelect: number
      maxSelect: number
      isRequired: boolean
      sortOrder: number
      items: Array<{
        id: string
        productId: string
        isDefault: boolean
        priceAdjustment: string | number
        sortOrder: number
      }>
    }>
  } | null
  availableProducts: Array<{ id: string; name: string; sku: string }>
}

export function ComboBuilder({
  productSku,
  comboData,
  availableProducts,
}: ComboBuilderProps) {
  const fetcher = useFetcher()
  const [groups, setGroups] = useState<ComboGroup[]>(
    comboData?.groups.map((g, gi) => ({
      id: crypto.randomUUID(),
      name: g.name,
      minSelect: g.minSelect,
      maxSelect: g.maxSelect,
      isRequired: g.isRequired,
      sortOrder: gi,
      items: g.items.map((item, ii) => ({
        id: crypto.randomUUID(),
        productId: item.productId,
        isDefault: item.isDefault,
        priceAdjustment: Number(item.priceAdjustment),
        sortOrder: ii,
      })),
    })) ?? []
  )

  function addGroup() {
    setGroups((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        name: '',
        minSelect: 1,
        maxSelect: 1,
        isRequired: true,
        sortOrder: prev.length,
        items: [],
      },
    ])
  }

  function removeGroup(id: string) {
    setGroups((prev) => prev.filter((g) => g.id !== id))
  }

  function updateGroup(id: string, patch: Partial<ComboGroup>) {
    setGroups((prev) => prev.map((g) => (g.id === id ? { ...g, ...patch } : g)))
  }

  function addItem(groupId: string) {
    setGroups((prev) =>
      prev.map((g) =>
        g.id === groupId
          ? {
              ...g,
              items: [
                ...g.items,
                {
                  id: crypto.randomUUID(),
                  productId: '',
                  isDefault: false,
                  priceAdjustment: 0,
                  sortOrder: g.items.length,
                },
              ],
            }
          : g
      )
    )
  }

  function removeItem(groupId: string, itemId: string) {
    setGroups((prev) =>
      prev.map((g) =>
        g.id === groupId
          ? { ...g, items: g.items.filter((i) => i.id !== itemId) }
          : g
      )
    )
  }

  function updateItem(
    groupId: string,
    itemId: string,
    patch: Partial<ComboGroupItem>
  ) {
    setGroups((prev) =>
      prev.map((g) =>
        g.id === groupId
          ? {
              ...g,
              items: g.items.map((i) =>
                i.id === itemId ? { ...i, ...patch } : i
              ),
            }
          : g
      )
    )
  }

  function handleSave() {
    const validGroups = groups
      .filter((g) => g.name.trim())
      .map((g, gi) => ({
        name: g.name.trim(),
        minSelect: g.minSelect,
        maxSelect: g.maxSelect,
        isRequired: g.isRequired,
        sortOrder: gi,
        items: g.items
          .filter((i) => i.productId)
          .map((i, ii) => ({
            productId: i.productId,
            isDefault: i.isDefault,
            priceAdjustment: i.priceAdjustment,
            sortOrder: ii,
          })),
      }))

    fetcher.submit(
      {
        _intent: 'upsert-combo',
        groups: JSON.stringify(validGroups),
      },
      { method: 'post', action: `/products/${productSku}/edit` }
    )
  }

  const isSaving = fetcher.state !== 'idle'

  return (
    <section className='bg-card rounded-xl p-6 shadow-sm'>
      <div className='mb-5 flex items-center justify-between'>
        <div className='flex items-center gap-2'>
          <Layers className='h-4 w-4 text-amber-500' />
          <div>
            <h2 className='font-semibold'>Grupos del combo</h2>
            <p className='text-muted-foreground text-xs'>
              Definí los grupos de elección que la cajera verá al agregar este
              combo
            </p>
          </div>
        </div>
        <Button
          type='button'
          variant='outline'
          size='sm'
          onClick={addGroup}
          className='shrink-0 gap-1.5'
        >
          <Plus className='h-3.5 w-3.5' />
          Añadir grupo
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

      {groups.length === 0 ? (
        <div className='border-border/50 rounded-lg border border-dashed p-6 text-center'>
          <p className='text-muted-foreground text-sm'>
            Sin grupos configurados. Añadí al menos uno (ej: Bebida,
            Acompañamiento).
          </p>
        </div>
      ) : (
        <div className='space-y-6'>
          {groups.map((group, gi) => (
            <div
              key={group.id}
              className='border-border/50 overflow-hidden rounded-lg border'
            >
              {/* Group header */}
              <div className='bg-muted/30 flex items-center gap-3 px-4 py-3'>
                <span className='text-muted-foreground text-xs font-medium'>
                  Grupo {gi + 1}
                </span>
                <input
                  type='text'
                  value={group.name}
                  onChange={(e) =>
                    updateGroup(group.id, { name: e.target.value })
                  }
                  placeholder='Nombre del grupo (ej: Bebida, Acompañamiento)'
                  className='border-input bg-background focus:ring-ring flex-1 rounded-md border px-2.5 py-1.5 text-sm focus:ring-2 focus:outline-none'
                />
                <button
                  type='button'
                  onClick={() => removeGroup(group.id)}
                  className='text-muted-foreground hover:text-destructive rounded p-1 transition-colors'
                >
                  <Trash2 className='h-4 w-4' />
                </button>
              </div>

              {/* Group settings */}
              <div className='border-border/30 bg-muted/10 flex flex-wrap items-center gap-4 border-b px-4 py-2'>
                <label className='flex items-center gap-1.5 text-xs'>
                  <span className='text-muted-foreground'>Mín:</span>
                  <input
                    type='number'
                    value={group.minSelect}
                    onChange={(e) =>
                      updateGroup(group.id, {
                        minSelect: Number(e.target.value),
                      })
                    }
                    min='0'
                    max={group.maxSelect}
                    className='border-input bg-background focus:ring-ring w-14 rounded border px-2 py-1 text-xs focus:ring-1 focus:outline-none'
                  />
                </label>
                <label className='flex items-center gap-1.5 text-xs'>
                  <span className='text-muted-foreground'>Máx:</span>
                  <input
                    type='number'
                    value={group.maxSelect}
                    onChange={(e) =>
                      updateGroup(group.id, {
                        maxSelect: Number(e.target.value),
                      })
                    }
                    min='1'
                    className='border-input bg-background focus:ring-ring w-14 rounded border px-2 py-1 text-xs focus:ring-1 focus:outline-none'
                  />
                </label>
                <label className='flex items-center gap-2 text-xs'>
                  <input
                    type='checkbox'
                    checked={group.isRequired}
                    onChange={(e) =>
                      updateGroup(group.id, { isRequired: e.target.checked })
                    }
                    className='border-input h-3.5 w-3.5 rounded accent-amber-500'
                  />
                  <span>Obligatorio</span>
                </label>
              </div>

              {/* Group items */}
              <div className='space-y-2 px-4 py-3'>
                {group.items.length === 0 ? (
                  <p className='text-muted-foreground text-xs'>
                    Sin opciones. Añadí los productos disponibles en este grupo.
                  </p>
                ) : (
                  <div className='border-border/40 overflow-hidden rounded border'>
                    <table className='w-full text-sm'>
                      <thead>
                        <tr className='border-border/40 bg-muted/30 border-b'>
                          <th className='text-muted-foreground px-3 py-2 text-left text-xs font-medium'>
                            Producto
                          </th>
                          <th className='text-muted-foreground px-3 py-2 text-left text-xs font-medium'>
                            +Precio
                          </th>
                          <th className='text-muted-foreground px-3 py-2 text-center text-xs font-medium'>
                            Default
                          </th>
                          <th className='px-3 py-2' />
                        </tr>
                      </thead>
                      <tbody className='divide-border/30 divide-y'>
                        {group.items.map((item) => (
                          <tr key={item.id}>
                            <td className='px-3 py-2'>
                              <select
                                value={item.productId}
                                onChange={(e) =>
                                  updateItem(group.id, item.id, {
                                    productId: e.target.value,
                                  })
                                }
                                className='border-input bg-background focus:ring-ring w-full rounded border px-2 py-1 text-xs focus:ring-1 focus:outline-none'
                              >
                                <option value=''>Seleccionar...</option>
                                {availableProducts.map((p) => (
                                  <option key={p.id} value={p.id}>
                                    {p.name}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className='px-3 py-2'>
                              <div className='flex items-center gap-1'>
                                <span className='text-muted-foreground text-xs'>
                                  Q
                                </span>
                                <input
                                  type='number'
                                  value={item.priceAdjustment}
                                  onChange={(e) =>
                                    updateItem(group.id, item.id, {
                                      priceAdjustment: Number(e.target.value),
                                    })
                                  }
                                  step='0.01'
                                  min='0'
                                  className='border-input bg-background focus:ring-ring w-16 rounded border px-2 py-1 text-xs focus:ring-1 focus:outline-none'
                                />
                              </div>
                            </td>
                            <td className='px-3 py-2 text-center'>
                              <input
                                type='checkbox'
                                checked={item.isDefault}
                                onChange={(e) =>
                                  updateItem(group.id, item.id, {
                                    isDefault: e.target.checked,
                                  })
                                }
                                className='border-input h-3.5 w-3.5 rounded accent-amber-500'
                              />
                            </td>
                            <td className='px-3 py-2 text-right'>
                              <button
                                type='button'
                                onClick={() => removeItem(group.id, item.id)}
                                className='text-muted-foreground hover:text-destructive transition-colors'
                              >
                                <Trash2 className='h-3.5 w-3.5' />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                <Button
                  type='button'
                  variant='ghost'
                  size='sm'
                  onClick={() => addItem(group.id)}
                  className='h-7 gap-1.5 text-xs'
                >
                  <Plus className='h-3 w-3' />
                  Añadir opción al grupo
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className='mt-6 flex justify-end'>
        <Button
          type='button'
          onClick={handleSave}
          disabled={isSaving || groups.length === 0}
          className='gap-2'
        >
          {isSaving ? 'Guardando...' : 'Guardar combo'}
        </Button>
      </div>
    </section>
  )
}
