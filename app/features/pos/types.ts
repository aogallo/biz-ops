export interface ProductAttributeValue {
  label: string
  priceAdjustment?: number
  hex?: string // for color swatches
}

export interface ProductAttribute {
  name: string
  key: string
  type: 'button' | 'color'
  values: ProductAttributeValue[]
}

export interface ProductAttributesJson {
  attributes: ProductAttribute[]
}

export interface CartItem {
  cartItemId: string // unique per cart line (allows same product with different attributes)
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
  selectedAttributes?: Record<string, string>
}

export interface CartTotals {
  subtotal: number
  ivaAmount: number
  discountAmount: number
  total: number
}

export type PrintMethod = 'qz-tray' | 'browser'

export interface PosTerminalWithSucursal {
  id: string
  name: string
  isActive: boolean
  autoGenerateInvoice: boolean
  autoPrintReceipt: boolean
  printerName: string | null
  printMethod: string
  sucursalId: string | null
  sucursalName: string | null
  defaultBusinessPartnerId: string | null
  companyId: string | null
  companyName: string | null
}

export interface OtherSucursalStock {
  name: string
  stock: number
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
  otherSucursalesStock: OtherSucursalStock[] | null
  attributesJson: ProductAttributesJson | null
}

export interface ReceiptLine {
  productName: string
  productSku: string
  quantity: string
  unitPrice: string
  total: string
}

export interface ReceiptPayment {
  method: string
  amount: string
  receivedAmount: string | null
  changeAmount: string | null
}

export interface ReceiptData {
  saleNumber: string
  terminalName: string | null
  cashierName: string | null
  customerName: string | null
  customerNit: string | null
  date: string
  lines: ReceiptLine[]
  payments: ReceiptPayment[]
  subtotal: string
  ivaAmount: string
  discountAmount: string
  total: string
  currency: string
  printerName: string | null
}

export type CartItemLike = Pick<CartItem, 'quantity' | 'unitPrice' | 'discountPercent' | 'ivaType' | 'ivaRate'> & { stock?: number | null }

export function calculateLineTotals(item: CartItemLike) {
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
