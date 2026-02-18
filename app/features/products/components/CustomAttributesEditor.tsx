import { useState } from 'react'
import { Plus, Trash2, X, LayoutList } from 'lucide-react'
import { Button } from '~/components/ui/button'
import { Switch } from '~/components/ui/switch'
import { useTranslation } from '~/i18n/context'

type AttributeType = 'text' | 'number' | 'boolean' | 'date' | 'select'

interface CustomAttribute {
  id: string
  name: string
  type: AttributeType
  required: boolean
  options: string[]
}

export interface AttributeDef {
  type: AttributeType
  required: boolean
  options?: string[]
}

interface CustomAttributesEditorProps {
  initialAttributes?: Record<string, AttributeDef> | null
}

function parseInitialAttributes(
  initial?: Record<string, AttributeDef> | null
): CustomAttribute[] {
  if (!initial) return []
  return Object.entries(initial).map(([name, def]) => ({
    id: crypto.randomUUID(),
    name,
    type: def.type,
    required: def.required,
    options: def.options ?? [],
  }))
}

export function CustomAttributesEditor({
  initialAttributes,
}: CustomAttributesEditorProps) {
  const { t } = useTranslation()
  const [attributes, setAttributes] = useState<CustomAttribute[]>(() =>
    parseInitialAttributes(initialAttributes)
  )
  const [optionInputs, setOptionInputs] = useState<Record<string, string>>({})

  function addAttribute() {
    setAttributes((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        name: '',
        type: 'text',
        required: false,
        options: [],
      },
    ])
  }

  function removeAttribute(id: string) {
    setAttributes((prev) => prev.filter((a) => a.id !== id))
    setOptionInputs((prev) => {
      const next = { ...prev }
      delete next[id]
      return next
    })
  }

  function updateAttribute(id: string, patch: Partial<CustomAttribute>) {
    setAttributes((prev) =>
      prev.map((a) => (a.id === id ? { ...a, ...patch } : a))
    )
  }

  function addOption(attrId: string) {
    const raw = optionInputs[attrId] ?? ''
    const value = raw.trim()
    if (!value) return
    setAttributes((prev) =>
      prev.map((a) =>
        a.id === attrId && !a.options.includes(value)
          ? { ...a, options: [...a.options, value] }
          : a
      )
    )
    setOptionInputs((prev) => ({ ...prev, [attrId]: '' }))
  }

  function removeOption(attrId: string, option: string) {
    setAttributes((prev) =>
      prev.map((a) =>
        a.id === attrId
          ? { ...a, options: a.options.filter((o) => o !== option) }
          : a
      )
    )
  }

  const attributesJson =
    attributes.length > 0
      ? JSON.stringify(
          attributes.reduce(
            (acc, attr) => {
              if (attr.name.trim()) {
                acc[attr.name.trim()] = {
                  type: attr.type,
                  required: attr.required,
                  ...(attr.type === 'select' && { options: attr.options }),
                }
              }
              return acc
            },
            {} as Record<string, { type: string; required: boolean; options?: string[] }>
          )
        )
      : null

  return (
    <section className='rounded-xl bg-card p-6 shadow-sm'>
      {attributesJson && (
        <input type='hidden' name='attributesJson' value={attributesJson} />
      )}

      <div className='mb-5 flex items-center justify-between'>
        <div className='flex items-center gap-2'>
          <LayoutList className='h-4 w-4 text-amber-500' />
          <div>
            <h2 className='font-semibold'>{t('products.customAttributes')}</h2>
            <p className='text-muted-foreground text-xs'>
              {t('products.customAttributesDesc')}
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
          {t('products.addAttribute')}
        </Button>
      </div>

      {attributes.length === 0 ? (
        <div className='rounded-lg border border-dashed border-border/50 p-6 text-center'>
          <p className='text-muted-foreground text-sm'>
            {t('products.noCustomAttributes')}
          </p>
        </div>
      ) : (
        <div className='overflow-hidden rounded-lg border border-border/50'>
          <table className='w-full text-sm'>
            <thead>
              <tr className='border-b border-border/50 bg-muted/40'>
                <th className='px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground'>
                  {t('products.fieldName')}
                </th>
                <th className='px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground'>
                  {t('products.fieldType')}
                </th>
                <th className='px-4 py-2.5 text-center text-xs font-medium uppercase tracking-wide text-muted-foreground'>
                  Required
                </th>
                <th className='px-4 py-2.5 text-right text-xs font-medium uppercase tracking-wide text-muted-foreground'>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className='divide-y divide-border/30'>
              {attributes.map((attr) => (
                <>
                  <tr key={attr.id} className='group'>
                    <td className='px-4 py-3'>
                      <input
                        type='text'
                        value={attr.name}
                        onChange={(e) =>
                          updateAttribute(attr.id, { name: e.target.value })
                        }
                        placeholder='e.g., Size'
                        className='w-full rounded-md border border-input bg-background px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1'
                      />
                    </td>
                    <td className='px-4 py-3'>
                      <select
                        value={attr.type}
                        onChange={(e) =>
                          updateAttribute(attr.id, {
                            type: e.target.value as AttributeType,
                            options: [],
                          })
                        }
                        className='rounded-md border border-input bg-background px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1'
                      >
                        <option value='text'>Text</option>
                        <option value='number'>Number</option>
                        <option value='boolean'>Boolean</option>
                        <option value='date'>Date</option>
                        <option value='select'>Select</option>
                      </select>
                    </td>
                    <td className='px-4 py-3 text-center'>
                      <div className='flex justify-center'>
                        <Switch
                          checked={attr.required}
                          onCheckedChange={(checked) =>
                            updateAttribute(attr.id, { required: checked })
                          }
                        />
                      </div>
                    </td>
                    <td className='px-4 py-3 text-right'>
                      <button
                        type='button'
                        onClick={() => removeAttribute(attr.id)}
                        className='text-muted-foreground hover:text-destructive rounded p-1 transition-colors'
                      >
                        <Trash2 className='h-4 w-4' />
                      </button>
                    </td>
                  </tr>

                  {attr.type === 'select' && (
                    <tr key={`${attr.id}-options`} className='bg-muted/20'>
                      <td colSpan={4} className='px-4 py-3'>
                        <div className='space-y-2'>
                          <p className='text-xs font-medium text-muted-foreground'>
                            Options
                          </p>
                          <div className='flex flex-wrap gap-1.5'>
                            {attr.options.map((opt) => (
                              <span
                                key={opt}
                                className='inline-flex items-center gap-1 rounded-md bg-background border border-border px-2 py-0.5 text-xs font-medium'
                              >
                                {opt}
                                <button
                                  type='button'
                                  onClick={() => removeOption(attr.id, opt)}
                                  className='text-muted-foreground hover:text-destructive transition-colors'
                                >
                                  <X className='h-3 w-3' />
                                </button>
                              </span>
                            ))}
                            <div className='flex items-center gap-1'>
                              <input
                                type='text'
                                value={optionInputs[attr.id] ?? ''}
                                onChange={(e) =>
                                  setOptionInputs((prev) => ({
                                    ...prev,
                                    [attr.id]: e.target.value,
                                  }))
                                }
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault()
                                    addOption(attr.id)
                                  }
                                }}
                                placeholder='Add option...'
                                className='h-6 rounded border border-dashed border-border bg-background px-2 text-xs focus:border-solid focus:outline-none focus:ring-1 focus:ring-ring'
                              />
                              <button
                                type='button'
                                onClick={() => addOption(attr.id)}
                                className='text-muted-foreground hover:text-foreground transition-colors'
                              >
                                <Plus className='h-3.5 w-3.5' />
                              </button>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
