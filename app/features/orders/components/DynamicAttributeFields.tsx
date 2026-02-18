import type { AttributeDef } from '~/features/products/components/CustomAttributesEditor'

interface DynamicAttributeFieldsProps {
  attributesJson: Record<string, AttributeDef> | null | undefined
  values: Record<string, string | number | boolean>
  onChange: (values: Record<string, string | number | boolean>) => void
}

const inputClass =
  'border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none'

export function DynamicAttributeFields({
  attributesJson,
  values,
  onChange,
}: DynamicAttributeFieldsProps) {
  if (!attributesJson || Object.keys(attributesJson).length === 0) {
    return null
  }

  function handleChange(name: string, value: string | number | boolean) {
    onChange({ ...values, [name]: value })
  }

  return (
    <div className='space-y-3 rounded-lg border border-dashed border-border/50 p-3'>
      <p className='text-xs font-medium text-muted-foreground uppercase tracking-wide'>
        Custom Attributes
      </p>
      <div className='grid gap-3 sm:grid-cols-2'>
        {Object.entries(attributesJson).map(([name, def]) => (
          <div key={name}>
            <label className='mb-1 block text-xs font-medium'>
              {name}
              {def.required && <span className='text-destructive ml-0.5'>*</span>}
            </label>

            {def.type === 'text' && (
              <input
                type='text'
                value={(values[name] as string) ?? ''}
                onChange={(e) => handleChange(name, e.target.value)}
                required={def.required}
                className={inputClass}
                placeholder={name}
              />
            )}

            {def.type === 'number' && (
              <input
                type='number'
                value={(values[name] as number) ?? ''}
                onChange={(e) => handleChange(name, Number(e.target.value))}
                required={def.required}
                className={inputClass}
                placeholder='0'
              />
            )}

            {def.type === 'select' && (
              <select
                value={(values[name] as string) ?? ''}
                onChange={(e) => handleChange(name, e.target.value)}
                required={def.required}
                className={inputClass}
              >
                <option value=''>Select...</option>
                {def.options?.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            )}

            {def.type === 'boolean' && (
              <div className='flex items-center gap-2 pt-1'>
                <input
                  type='checkbox'
                  checked={Boolean(values[name])}
                  onChange={(e) => handleChange(name, e.target.checked)}
                  className='h-4 w-4 rounded border-input'
                />
                <span className='text-sm text-muted-foreground'>Yes</span>
              </div>
            )}

            {def.type === 'date' && (
              <input
                type='date'
                value={(values[name] as string) ?? ''}
                onChange={(e) => handleChange(name, e.target.value)}
                required={def.required}
                className={inputClass}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
