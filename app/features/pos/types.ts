export interface CartItem {
  productId: string
  productName: string
  productSku: string
  unitPrice: number
  quantity: number
  discountPercent: number
  ivaType: 'taxed' | 'exempt' | 'non_subject'
  ivaRate: number
  productType: 'STOCK' | 'MADE_TO_ORDER' | 'SERVICE'
  stock: number | null
}

export interface CartTotals {
  subtotal: number
  ivaAmount: number
  discountAmount: number
  total: number
}

export interface PosTerminalWithSucursal {
  id: string
  name: string
  isActive: boolean
  autoGenerateInvoice: boolean
  sucursalId: string | null
  sucursalName: string | null
  defaultBusinessPartnerId: string | null
}

export interface PosProductForGrid {
  id: string
  name: string
  sku: string
  price: string
  stock: number | null
  imageUrl: string | null
  productType: 'STOCK' | 'MADE_TO_ORDER' | 'SERVICE'
  categoryId: string | null
  categoryName: string | null
  categoryColor: string | null
  sucursalStock: number | null
}

export function calculateLineTotals(item: CartItem) {
  const qty = item.quantity
  const price = item.unitPrice
  const grossSubtotal = qty * price
  const discountAmount =
    item.discountPercent > 0
      ? (grossSubtotal * item.discountPercent) / 100
      : 0
  const subtotal = grossSubtotal - discountAmount

  let ivaAmount = 0
  if (item.ivaType === 'taxed') {
    ivaAmount = (subtotal * item.ivaRate) / 100
  }

  const total = subtotal + ivaAmount

  return { subtotal, discountAmount, ivaAmount, total }
}

export function calculateCartTotals(items: CartItem[]): CartTotals {
  return items.reduce(
    (acc, item) => {
      const line = calculateLineTotals(item)
      return {
        subtotal: acc.subtotal + line.subtotal,
        ivaAmount: acc.ivaAmount + line.ivaAmount,
        discountAmount: acc.discountAmount + line.discountAmount,
        total: acc.total + line.total,
      }
    },
    { subtotal: 0, ivaAmount: 0, discountAmount: 0, total: 0 }
  )
}
