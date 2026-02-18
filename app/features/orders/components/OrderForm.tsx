import { useState } from 'react'
import { Form } from 'react-router'
import { ChevronDown, ChevronRight, Pencil, Plus, Trash2 } from 'lucide-react'
import { Button } from '~/components/ui/button'
import { Combobox } from '~/components/ui/combobox'
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
  isExpanded: boolean
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
  const [selectedBpId, setSelectedBpId] = useState<string | null>(null)

  const selectedBpName =
    businessPartners.find((bp) => bp.id === selectedBpId)?.name ?? null

  function addLineItem(product: Product) {
    setLineItems((prev) => [
      ...prev.map((item) => ({ ...item, isExpanded: false })),
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
        isExpanded: true,
      },
    ])
    setProductSearch('')
  }

  function toggleLineItem(key: string) {
    setLineItems((prev) =>
      prev.map((item) =>
        item.key === key ? { ...item, isExpanded: !item.isExpanded } : item
      )
    )
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
              <label className='mb-1.5 block text-sm font-medium'>
                Company *
              </label>
              <Combobox
                name='companyId'
                options={companies.map((c) => ({
                  value: c.id,
                  label: c.name,
                }))}
                placeholder='Select company...'
                searchPlaceholder='Search companies...'
                emptyMessage='No companies found.'
              />
            </div>
            <div>
              <label className='mb-1.5 block text-sm font-medium'>
                Business Partner *
              </label>
              <Combobox
                name='businessPartnerId'
                options={businessPartners.map((bp) => ({
                  value: bp.id,
                  label: bp.name,
                }))}
                placeholder='Select partner...'
                searchPlaceholder='Search partners...'
                emptyMessage='No partners found.'
                onValueChange={(value) => setSelectedBpId(value || null)}
              />
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
            <div className='space-y-2'>
              {lineItems.map((item) => (
                <div key={item.key} className='rounded-lg border'>
                  {/* Summary row (always visible) */}
                  <div className='flex items-center gap-3 p-3'>
                    <button
                      type='button'
                      onClick={() => toggleLineItem(item.key)}
                      className='text-muted-foreground hover:text-foreground p-0.5'
                    >
                      {item.isExpanded ? (
                        <ChevronDown className='h-4 w-4' />
                      ) : (
                        <ChevronRight className='h-4 w-4' />
                      )}
                    </button>
                    <div className='min-w-0 flex-1'>
                      <div className='flex items-center gap-2'>
                        <p className='truncate text-sm font-medium'>
                          {item.productName}
                        </p>
                        <span className='text-muted-foreground font-mono text-xs'>
                          {item.productSku}
                        </span>
                      </div>
                      {!item.isExpanded && (
                        <p className='text-muted-foreground text-xs'>
                          Qty: {item.quantity} &times; $
                          {Number(item.unitPrice).toFixed(2)} &bull;{' '}
                          {item.sourceType === 'INVENTORY'
                            ? 'Inventory'
                            : 'On Demand'}
                          {item.recipients.length > 0 &&
                            ` • ${item.recipients.length} recipient${item.recipients.length !== 1 ? 's' : ''}`}
                        </p>
                      )}
                    </div>
                    <p className='text-sm font-semibold whitespace-nowrap'>
                      $
                      {(Number(item.unitPrice) * item.quantity).toFixed(2)}
                    </p>
                    <div className='flex items-center gap-1'>
                      {!item.isExpanded && (
                        <button
                          type='button'
                          onClick={() => toggleLineItem(item.key)}
                          className='text-muted-foreground hover:text-foreground p-1'
                        >
                          <Pencil className='h-3.5 w-3.5' />
                        </button>
                      )}
                      <button
                        type='button'
                        onClick={() => removeLineItem(item.key)}
                        className='text-muted-foreground hover:text-destructive p-1'
                      >
                        <Trash2 className='h-3.5 w-3.5' />
                      </button>
                    </div>
                  </div>

                  {/* Expanded edit form */}
                  {item.isExpanded && (
                    <div className='space-y-3 border-t px-4 pb-4 pt-3'>
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
                            $
                            {(Number(item.unitPrice) * item.quantity).toFixed(2)}
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
                          <label className='text-xs font-medium'>
                            Recipients
                          </label>
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
                        {item.recipients.length > 0 ? (
                          <div className='space-y-1.5'>
                            {item.recipients.map((r) => (
                              <div
                                key={r.key}
                                className='flex items-center gap-2'
                              >
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
                        ) : (
                          <p className='text-muted-foreground text-xs italic'>
                            {selectedBpName
                              ? `Defaults to "${selectedBpName}"`
                              : 'Defaults to business partner'}
                          </p>
                        )}
                      </div>

                      <div className='flex justify-end pt-1'>
                        <Button
                          type='button'
                          variant='secondary'
                          size='sm'
                          onClick={() => toggleLineItem(item.key)}
                        >
                          Done
                        </Button>
                      </div>
                    </div>
                  )}
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
