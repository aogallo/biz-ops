import { useState } from 'react'
import { Form } from 'react-router'
import { Plus, Trash2 } from 'lucide-react'
import { Button } from '~/components/ui/button'
import { DynamicAttributeFields } from './DynamicAttributeFields'
import type { AttributeDef } from '~/features/products/components/CustomAttributesEditor'

interface Product {
  id: string
  name: string
  sku: string
  price: string
  attributesJson: Record<string, AttributeDef> | null
}

interface Company {
  id: string
  name: string
}

interface BusinessPartner {
  id: string
  name: string
}

interface LineItem {
  key: string
  productId: string
  productName: string
  productSku: string
  quantity: number
  unitPrice: string
  sourceType: 'INVENTORY' | 'ON_DEMAND'
  customAttributesJson: Record<string, string | number | boolean>
  attributesDef: Record<string, AttributeDef> | null
  recipients: Recipient[]
}

interface Recipient {
  key: string
  name: string
}

interface OrderFormProps {
  companies: Company[]
  businessPartners: BusinessPartner[]
  products: Product[]
  isSubmitting: boolean
  error?: string | null
}

const inputClass =
  'border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none'

export function OrderForm({
  companies,
  businessPartners,
  products,
  isSubmitting,
  error,
}: OrderFormProps) {
  const [lineItems, setLineItems] = useState<LineItem[]>([])
  const [productSearch, setProductSearch] = useState('')

  function addLineItem(product: Product) {
    setLineItems((prev) => [
      ...prev,
      {
        key: crypto.randomUUID(),
        productId: product.id,
        productName: product.name,
        productSku: product.sku,
        quantity: 1,
        unitPrice: product.price,
        sourceType: 'INVENTORY',
        customAttributesJson: {},
        attributesDef: product.attributesJson,
        recipients: [],
      },
    ])
    setProductSearch('')
  }

  function removeLineItem(key: string) {
    setLineItems((prev) => prev.filter((item) => item.key !== key))
  }

  function updateLineItem(key: string, patch: Partial<LineItem>) {
    setLineItems((prev) =>
      prev.map((item) => (item.key === key ? { ...item, ...patch } : item))
    )
  }

  const subtotal = lineItems.reduce(
    (sum, item) => sum + Number(item.unitPrice) * item.quantity,
    0
  )

  const detailsJson = JSON.stringify(
    lineItems.map((item) => ({
      productId: item.productId,
      productName: item.productName,
      productSku: item.productSku,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      sourceType: item.sourceType,
      customAttributesJson:
        Object.keys(item.customAttributesJson).length > 0
          ? item.customAttributesJson
          : null,
      recipients: item.recipients
        .filter((r) => r.name.trim())
        .map((r) => ({ name: r.name.trim(), metadataJson: null })),
    }))
  )

  const filteredProducts = productSearch
    ? products.filter(
        (p) =>
          p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
          p.sku.toLowerCase().includes(productSearch.toLowerCase())
      )
    : []

  return (
    <Form method='post'>
      <input type='hidden' name='details' value={detailsJson} />

      {error && (
        <div className='bg-destructive/10 text-destructive mb-6 rounded-lg p-4 text-sm'>
          {error}
        </div>
      )}

      <div className='space-y-6'>
        {/* Header Section */}
        <section className='bg-card rounded-xl p-6 shadow-sm'>
          <h2 className='mb-4 font-semibold'>Order Information</h2>
          <div className='grid gap-4 sm:grid-cols-3'>
            <div>
              <label
                htmlFor='companyId'
                className='mb-1.5 block text-sm font-medium'
              >
                Company *
              </label>
              <select
                id='companyId'
                name='companyId'
                required
                className={inputClass}
              >
                <option value=''>Select company...</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                htmlFor='businessPartnerId'
                className='mb-1.5 block text-sm font-medium'
              >
                Business Partner *
              </label>
              <select
                id='businessPartnerId'
                name='businessPartnerId'
                required
                className={inputClass}
              >
                <option value=''>Select partner...</option>
                {businessPartners.map((bp) => (
                  <option key={bp.id} value={bp.id}>
                    {bp.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                htmlFor='orderDate'
                className='mb-1.5 block text-sm font-medium'
              >
                Order Date *
              </label>
              <input
                type='date'
                id='orderDate'
                name='orderDate'
                required
                defaultValue={new Date().toISOString().split('T')[0]}
                className={inputClass}
              />
            </div>
          </div>
        </section>

        {/* Line Items */}
        <section className='bg-card rounded-xl p-6 shadow-sm'>
          <div className='mb-4 flex items-center justify-between'>
            <h2 className='font-semibold'>Line Items</h2>
            <span className='text-muted-foreground text-sm'>
              {lineItems.length} item{lineItems.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Product search */}
          <div className='relative mb-4'>
            <input
              type='text'
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              placeholder='Search products by name or SKU...'
              className={inputClass}
            />
            {filteredProducts.length > 0 && productSearch && (
              <div className='bg-popover absolute z-10 mt-1 max-h-48 w-full overflow-auto rounded-md border shadow-md'>
                {filteredProducts.slice(0, 10).map((p) => (
                  <button
                    key={p.id}
                    type='button'
                    onClick={() => addLineItem(p)}
                    className='hover:bg-accent flex w-full items-center justify-between px-3 py-2 text-sm'
                  >
                    <span>
                      <span className='font-medium'>{p.name}</span>
                      <span className='text-muted-foreground ml-2'>
                        ({p.sku})
                      </span>
                    </span>
                    <span className='text-muted-foreground'>
                      ${Number(p.price).toFixed(2)}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {lineItems.length === 0 ? (
            <div className='text-muted-foreground rounded-lg border border-dashed p-8 text-center text-sm'>
              Search and select products to add line items
            </div>
          ) : (
            <div className='space-y-4'>
              {lineItems.map((item) => (
                <div key={item.key} className='space-y-3 rounded-lg border p-4'>
                  <div className='flex items-start justify-between'>
                    <div>
                      <p className='font-medium'>{item.productName}</p>
                      <p className='text-muted-foreground font-mono text-xs'>
                        {item.productSku}
                      </p>
                    </div>
                    <button
                      type='button'
                      onClick={() => removeLineItem(item.key)}
                      className='text-muted-foreground hover:text-destructive p-1'
                    >
                      <Trash2 className='h-4 w-4' />
                    </button>
                  </div>

                  <div className='grid gap-3 sm:grid-cols-4'>
                    <div>
                      <label className='mb-1 block text-xs font-medium'>
                        Quantity
                      </label>
                      <input
                        type='number'
                        min='1'
                        value={item.quantity}
                        onChange={(e) =>
                          updateLineItem(item.key, {
                            quantity: Math.max(1, Number(e.target.value)),
                          })
                        }
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className='mb-1 block text-xs font-medium'>
                        Unit Price
                      </label>
                      <input
                        type='number'
                        step='0.01'
                        min='0'
                        value={item.unitPrice}
                        onChange={(e) =>
                          updateLineItem(item.key, {
                            unitPrice: e.target.value,
                          })
                        }
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className='mb-1 block text-xs font-medium'>
                        Source
                      </label>
                      <select
                        value={item.sourceType}
                        onChange={(e) =>
                          updateLineItem(item.key, {
                            sourceType: e.target.value as
                              | 'INVENTORY'
                              | 'ON_DEMAND',
                          })
                        }
                        className={inputClass}
                      >
                        <option value='INVENTORY'>Inventory</option>
                        <option value='ON_DEMAND'>On Demand</option>
                      </select>
                    </div>
                    <div>
                      <label className='mb-1 block text-xs font-medium'>
                        Line Total
                      </label>
                      <p className='px-3 py-2 text-sm font-semibold'>
                        ${(Number(item.unitPrice) * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  </div>

                  {/* Dynamic custom attribute fields */}
                  <DynamicAttributeFields
                    attributesJson={item.attributesDef}
                    values={item.customAttributesJson}
                    onChange={(values) =>
                      updateLineItem(item.key, {
                        customAttributesJson: values,
                      })
                    }
                  />

                  {/* Recipients per line item */}
                  <div className='border-t pt-3'>
                    <div className='mb-2 flex items-center justify-between'>
                      <label className='text-xs font-medium'>Recipients</label>
                      <Button
                        type='button'
                        variant='ghost'
                        size='sm'
                        className='h-6 px-2 text-xs'
                        onClick={() =>
                          updateLineItem(item.key, {
                            recipients: [
                              ...item.recipients,
                              { key: crypto.randomUUID(), name: '' },
                            ],
                          })
                        }
                      >
                        <Plus className='mr-1 h-3 w-3' />
                        Add
                      </Button>
                    </div>
                    {item.recipients.length > 0 && (
                      <div className='space-y-1.5'>
                        {item.recipients.map((r) => (
                          <div key={r.key} className='flex items-center gap-2'>
                            <input
                              type='text'
                              value={r.name}
                              onChange={(e) =>
                                updateLineItem(item.key, {
                                  recipients: item.recipients.map((rec) =>
                                    rec.key === r.key
                                      ? { ...rec, name: e.target.value }
                                      : rec
                                  ),
                                })
                              }
                              placeholder='Recipient name'
                              className={inputClass}
                            />
                            <button
                              type='button'
                              onClick={() =>
                                updateLineItem(item.key, {
                                  recipients: item.recipients.filter(
                                    (rec) => rec.key !== r.key
                                  ),
                                })
                              }
                              className='text-muted-foreground hover:text-destructive p-1'
                            >
                              <Trash2 className='h-3.5 w-3.5' />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Summary & Submit */}
        <div className='bg-card flex items-center justify-between rounded-xl p-6 shadow-sm'>
          <div>
            <p className='text-muted-foreground text-sm'>
              {lineItems.length} item{lineItems.length !== 1 ? 's' : ''}
            </p>
            <p className='text-2xl font-bold'>${subtotal.toFixed(2)}</p>
          </div>
          <div className='flex items-center gap-3'>
            <Button type='button' variant='outline' asChild>
              <a href='/purchase/orders'>Cancel</a>
            </Button>
            <Button
              type='submit'
              disabled={isSubmitting || lineItems.length === 0}
            >
              {isSubmitting ? 'Creating...' : 'Create Order (Draft)'}
            </Button>
          </div>
        </div>
      </div>
    </Form>
  )
}
