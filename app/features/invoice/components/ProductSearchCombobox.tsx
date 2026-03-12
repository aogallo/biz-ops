import { useMemo } from 'react'
import { Combobox, type ComboboxOption } from '~/components/ui/combobox'

export interface ProductOption {
  id: string
  sku: string
  name: string
  price: string | null
}

interface ProductSearchComboboxProps {
  products: ProductOption[]
  value: string
  onValueChange: (productId: string, product?: ProductOption) => void
  placeholder?: string
  disabled?: boolean
  size?: 'default' | 'sm'
}

export function ProductSearchCombobox({
  products,
  value,
  onValueChange,
  placeholder = 'Search products...',
  disabled = false,
  size = 'default',
}: ProductSearchComboboxProps) {
  const productOptions = useMemo<ComboboxOption[]>(
    () =>
      products.map((product) => ({
        value: product.id,
        label: `${product.sku} - ${product.name}`,
        description: product.price
          ? `Q ${Number(product.price).toFixed(2)}`
          : undefined,
      })),
    [products]
  )

  const handleValueChange = (productId: string) => {
    const product = products.find((p) => p.id === productId)
    onValueChange(productId, product)
  }

  return (
    <Combobox
      options={productOptions}
      value={value}
      onValueChange={handleValueChange}
      placeholder={placeholder}
      searchPlaceholder='Search by SKU or name...'
      emptyMessage='No products found.'
      disabled={disabled}
      size={size}
    />
  )
}
