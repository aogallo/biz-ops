import { useState } from 'react'
import { Plus, Trash2, X, LayoutList } from 'lucide-react'
import { Button } from '~/components/ui/button'

// Kept for backwards compatibility with order/quotation forms
export interface AttributeDef {
  type: 'text' | 'number' | 'boolean' | 'date' | 'select'
  required: boolean
  options?: string[]
}

export interface ProductAttributeValue {
  label: string
  priceAdjustment: number
}

export interface ProductAttribute {
  name: string
  key: string
  type: 'button'
  values: ProductAttributeValue[]
}

export interface ProductAttributesJson {
  attributes: ProductAttribute[]
}

interface InternalValue {
  id: string
  label: string
  priceAdjustment: number
}

interface InternalAttribute {
  id: string
  name: string
  values: InternalValue[]
}

function parseInitialAttributes(initial: unknown): InternalAttribute[] {
  if (!initial || typeof initial !== 'object') return []

  const data = initial as Record<string, unknown>

  // New rich format: { attributes: [...] }
  if (Array.isArray(data.attributes)) {
    return (data.attributes as ProductAttribute[]).map((attr) => ({
      id: crypto.randomUUID(),
      name: attr.name,
      values: (attr.values ?? []).map((v) => ({
        id: crypto.randomUUID(),
        label: v.label,
        priceAdjustment: v.priceAdjustment ?? 0,
      })),
    }))
  }

  // Legacy format: { "Name": { type, required, options: string[] } }
  return Object.entries(data)
    .filter(([, def]) => def && typeof def === 'object')
    .map(([name, def]) => {
      const attrDef = def as { options?: string[] }
      return {
        id: crypto.randomUUID(),
        name,
        values: (attrDef.options ?? []).map((opt) => ({
          id: crypto.randomUUID(),
          label: opt,
          priceAdjustment: 0,
        })),
      }
    })
}

function toAttributesJson(attrs: InternalAttribute[]): ProductAttributesJson | null {
  const valid = attrs.filter((a) => a.name.trim())
  if (valid.length === 0) return null

  return {
    attributes: valid.map((attr) => ({
      name: attr.name.trim(),
      key: attr.name
        .trim()
        .toLowerCase()
        .replace(/\s+/g, '_')
        .replace(/[^a-z0-9_]/g, ''),
      type: 'button',
      values: attr.values
        .filter((v) => v.label.trim())
        .map((v) => ({
          label: v.label.trim(),
          priceAdjustment: v.priceAdjustment,
        })),
    })),
  }
}

interface CustomAttributesEditorProps {
  initialAttributes?: unknown
}

export function CustomAttributesEditor({ initialAttributes }: CustomAttributesEditorProps) {
  const [attributes, setAttributes] = useState<InternalAttribute[]>(() =>
    parseInitialAttributes(initialAttributes)
  )

  function addAttribute() {
    setAttributes((prev) => [
      ...prev,
      { id: crypto.randomUUID(), name: '', values: [] },
    ])
  }

  function removeAttribute(id: string) {
    setAttributes((prev) => prev.filter((a) => a.id !== id))
  }

  function updateAttributeName(id: string, name: string) {
    setAttributes((prev) => prev.map((a) => (a.id === id ? { ...a, name } : a)))
  }

  function addValue(attrId: string) {
    setAttributes((prev) =>
      prev.map((a) =>
        a.id === attrId
          ? {
              ...a,
              values: [
                ...a.values,
                { id: crypto.randomUUID(), label: '', priceAdjustment: 0 },
              ],
            }
          : a
      )
    )
  }

  function removeValue(attrId: string, valueId: string) {
    setAttributes((prev) =>
      prev.map((a) =>
        a.id === attrId
          ? { ...a, values: a.values.filter((v) => v.id !== valueId) }
          : a
      )
    )
  }

  function updateValue(attrId: string, valueId: string, patch: Partial<InternalValue>) {
    setAttributes((prev) =>
      prev.map((a) =>
        a.id === attrId
          ? {
              ...a,
              values: a.values.map((v) => (v.id === valueId ? { ...v, ...patch } : v)),
            }
          : a
      )
    )
  }

  const attributesJson = toAttributesJson(attributes)
  const serialized = attributesJson ? JSON.stringify(attributesJson) : null

  return (
    <section className='rounded-xl bg-card p-6 shadow-sm'>
      {serialized && (
        <input type='hidden' name='attributesJson' value={serialized} />
      )}

      <div className='mb-5 flex items-center justify-between'>
        <div className='flex items-center gap-2'>
          <LayoutList className='h-4 w-4 text-amber-500' />
          <div>
            <h2 className='font-semibold'>Atributos / Variantes</h2>
            <p className='text-muted-foreground text-xs'>
              Opciones del producto con ajuste de precio (ej: Tamaño, Extras)
            </p>
          </div>
        </div>
        <Button
          type='button'
          variant='outline'
          size='sm'
          onClick={addAttribute}
          className='shrink-0 gap-1.5'
        >
          <Plus className='h-3.5 w-3.5' />
          Añadir atributo
        </Button>
      </div>

      {attributes.length === 0 ? (
        <div className='rounded-lg border border-dashed border-border/50 p-6 text-center'>
          <p className='text-muted-foreground text-sm'>
            Sin atributos. Añadí uno para habilitar selección de opciones en el POS.
          </p>
        </div>
      ) : (
        <div className='space-y-4'>
          {attributes.map((attr) => (
            <div
              key={attr.id}
              className='overflow-hidden rounded-lg border border-border/50'
            >
              <div className='flex items-center gap-3 bg-muted/30 px-4 py-3'>
                <input
                  type='text'
                  value={attr.name}
                  onChange={(e) => updateAttributeName(attr.id, e.target.value)}
                  placeholder='Nombre del atributo (ej: Tamaño, Extras, Cocción)'
                  className='flex-1 rounded-md border border-input bg-background px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring'
                />
                <button
                  type='button'
                  onClick={() => removeAttribute(attr.id)}
                  className='text-muted-foreground hover:text-destructive rounded p-1 transition-colors'
                >
                  <Trash2 className='h-4 w-4' />
                </button>
              </div>

              <div className='space-y-2 px-4 py-3'>
                {attr.values.length === 0 ? (
                  <p className='text-muted-foreground text-xs'>Sin opciones todavía.</p>
                ) : (
                  attr.values.map((val) => (
                    <div key={val.id} className='flex items-center gap-2'>
                      <input
                        type='text'
                        value={val.label}
                        onChange={(e) =>
                          updateValue(attr.id, val.id, { label: e.target.value })
                        }
                        placeholder='Opción (ej: Grande, Con queso, Término medio)'
                        className='flex-1 rounded-md border border-input bg-background px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring'
                      />
                      <span className='text-muted-foreground text-xs'>+Q</span>
                      <input
                        type='number'
                        value={val.priceAdjustment}
                        onChange={(e) =>
                          updateValue(attr.id, val.id, {
                            priceAdjustment: Number(e.target.value),
                          })
                        }
                        step='0.01'
                        min='0'
                        className='w-20 rounded-md border border-input bg-background px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring'
                      />
                      <button
                        type='button'
                        onClick={() => removeValue(attr.id, val.id)}
                        className='text-muted-foreground hover:text-destructive transition-colors'
                      >
                        <X className='h-3.5 w-3.5' />
                      </button>
                    </div>
                  ))
                )}
                <Button
                  type='button'
                  variant='ghost'
                  size='sm'
                  onClick={() => addValue(attr.id)}
                  className='h-7 gap-1.5 text-xs'
                >
                  <Plus className='h-3 w-3' />
                  Añadir opción
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
