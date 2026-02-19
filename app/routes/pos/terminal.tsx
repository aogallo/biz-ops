import { useState, useCallback } from 'react'
import { useFetcher, redirect } from 'react-router'
import { posRepository } from '~/features/pos/server/repository'
import { createSaleAction } from '~/features/pos/server/actions/create-sale.action'
import { checkoutSchema } from '~/features/pos/schemas'
import { PosHeader } from '~/features/pos/components/PosHeader'
import { PosProductSearch } from '~/features/pos/components/PosProductSearch'
import { PosProductGrid } from '~/features/pos/components/PosProductGrid'
import { PosCart } from '~/features/pos/components/PosCart'
import { PosCustomerSearch } from '~/features/pos/components/PosCustomerSearch'
import { PosPaymentDialog } from '~/features/pos/components/PosPaymentDialog'
import { PosReceiptPreview } from '~/features/pos/components/PosReceiptPreview'
import type { ReceiptData } from '~/features/pos/components/PosReceiptPreview'
import {
  type CartItem,
  type PosProductForGrid,
  calculateCartTotals,
} from '~/features/pos/types'
import type { CheckoutPayment } from '~/features/pos/schemas'
import { requireAuth } from '~/server/auth/session.server'
import type { Route } from './+types/terminal'

export async function loader({ request }: Route.LoaderArgs) {
  const session = await requireAuth(request)
  const organizationId = session.session.activeOrganizationId
  const url = new URL(request.url)
  const terminalId = url.searchParams.get('terminalId')

  if (!organizationId || !terminalId) {
    throw redirect('/pos')
  }

  const terminal = await posRepository.getTerminalById(terminalId)
  if (!terminal || terminal.organizationId !== organizationId) {
    throw redirect('/pos')
  }

  const [products, categories] = await Promise.all([
    posRepository.getProductsForPos(organizationId),
    posRepository.getCategories(organizationId),
  ])

  return {
    terminal,
    products,
    categories,
    cashierId: session.user.id,
    cashierName: session.user.name,
    organizationId,
    defaultBusinessPartnerId: terminal.defaultBusinessPartnerId,
  }
}

export async function action({ request }: Route.ActionArgs) {
  const session = await requireAuth(request)
  const formData = await request.formData()
  const intent = formData.get('intent')

  if (intent === 'checkout') {
    const rawData = formData.get('data')
    if (!rawData || typeof rawData !== 'string') {
      return { error: 'Invalid data' }
    }

    const parsed = checkoutSchema.safeParse(JSON.parse(rawData))
    if (!parsed.success) {
      return {
        error: 'Validation failed',
        fieldErrors: parsed.error.flatten().fieldErrors,
      }
    }

    try {
      const result = await createSaleAction(parsed.data)

      // Fetch sale details for receipt
      const sale = await posRepository.getSaleById(result.saleId)

      return {
        success: true,
        sale: {
          saleNumber: result.saleNumber,
          saleId: result.saleId,
          receipt: sale
            ? {
                saleNumber: sale.saleNumber,
                terminalName: sale.terminal?.name ?? null,
                cashierName: sale.cashier?.name ?? null,
                customerName: sale.businessPartner?.name ?? null,
                customerNit: sale.businessPartner?.nit ?? null,
                date: new Date(sale.createdAt).toLocaleString('es-GT'),
                lines: sale.lines.map((l) => ({
                  productName: l.productName,
                  productSku: l.productSku,
                  quantity: l.quantity,
                  unitPrice: l.unitPrice,
                  total: l.total,
                })),
                payments: sale.payments.map((p) => ({
                  method: p.method,
                  amount: p.amount,
                  receivedAmount: p.receivedAmount,
                  changeAmount: p.changeAmount,
                })),
                subtotal: sale.subtotal,
                ivaAmount: sale.ivaAmount,
                discountAmount: sale.discountAmount,
                total: sale.total,
                currency: sale.currency,
              }
            : null,
        },
      }
    } catch (error) {
      return {
        error:
          error instanceof Error ? error.message : 'Error al procesar la venta',
      }
    }
  }

  if (intent === 'search-customers') {
    const organizationId = session.session.activeOrganizationId
    const query = formData.get('query')
    if (!organizationId || !query || typeof query !== 'string') {
      return { customers: [] }
    }
    const customers = await posRepository.searchBusinessPartners(
      organizationId,
      query
    )
    console.log('customers....', customers)
    return { customers }
  }

  return { error: 'Unknown intent' }
}

export default function PosTerminal({ loaderData }: Route.ComponentProps) {
  const {
    terminal,
    products: initialProducts,
    categories,
    cashierId,
    cashierName,
    organizationId,
    defaultBusinessPartnerId,
  } = loaderData

  const fetcher = useFetcher<typeof action>()
  const customerFetcher = useFetcher<typeof action>()

  const [cart, setCart] = useState<CartItem[]>([])
  const [search, setSearch] = useState('')
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    null
  )
  const [selectedCustomer, setSelectedCustomer] = useState<{
    id: string
    name: string
    nit: string | null
  } | null>(null)
  const [paymentOpen, setPaymentOpen] = useState(false)
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null)
  const [receiptOpen, setReceiptOpen] = useState(false)

  // Filter products
  const filteredProducts = initialProducts.filter((p) => {
    if (selectedCategoryId && p.categoryId !== selectedCategoryId) return false
    if (search) {
      const q = search.toLowerCase()
      return p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)
    }
    return true
  })

  const totals = calculateCartTotals(cart)

  const addToCart = useCallback((product: PosProductForGrid) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.productId === product.id)
      if (existing) {
        const max =
          product.productType === 'STOCK' && product.stock !== null
            ? product.stock
            : Infinity
        if (existing.quantity >= max) return prev
        return prev.map((item) =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      }
      return [
        ...prev,
        {
          productId: product.id,
          productName: product.name,
          productSku: product.sku,
          unitPrice: Number(product.price),
          quantity: 1,
          discountPercent: 0,
          ivaType: 'taxed' as const,
          ivaRate: 12,
          productType: product.productType as
            | 'STOCK'
            | 'MADE_TO_ORDER'
            | 'SERVICE',
          stock: product.stock,
        },
      ]
    })
  }, [])

  const handleQuantityChange = useCallback(
    (productId: string, quantity: number) => {
      setCart((prev) =>
        prev.map((item) =>
          item.productId === productId ? { ...item, quantity } : item
        )
      )
    },
    []
  )

  const handleRemoveItem = useCallback((productId: string) => {
    setCart((prev) => prev.filter((item) => item.productId !== productId))
  }, [])

  const handleBarcodeScan = useCallback(
    (barcode: string) => {
      const product = initialProducts.find((p) => p.sku === barcode)
      if (product) {
        addToCart(product)
      }
    },
    [initialProducts, addToCart]
  )

  const handleCustomerSearch = useCallback(
    (query: string) => {
      if (query.length >= 2) {
        customerFetcher.submit(
          { intent: 'search-customers', query },
          { method: 'post' }
        )
      }
    },
    [customerFetcher]
  )

  const handleCheckout = useCallback(
    (payments: CheckoutPayment[]) => {
      const businessPartnerId = selectedCustomer?.id ?? defaultBusinessPartnerId

      if (!businessPartnerId) {
        alert(
          'No hay un cliente seleccionado ni un cliente por defecto configurado en la caja.'
        )
        return
      }

      const data = {
        terminalId: terminal.id,
        organizationId,
        companyId: terminal.companyId,
        cashierId,
        businessPartnerId,
        lines: cart.map((item) => ({
          productId: item.productId,
          productName: item.productName,
          productSku: item.productSku,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discountPercent: item.discountPercent,
          ivaType: item.ivaType,
          ivaRate: item.ivaRate,
          productType: item.productType,
        })),
        payments,
      }

      fetcher.submit(
        { intent: 'checkout', data: JSON.stringify(data) },
        { method: 'post' }
      )
    },
    [
      cart,
      selectedCustomer,
      defaultBusinessPartnerId,
      terminal,
      organizationId,
      cashierId,
      fetcher,
    ]
  )

  // Handle successful checkout
  const fetcherData = fetcher.data
  if (
    fetcherData &&
    'success' in fetcherData &&
    fetcherData.success &&
    fetcherData.sale?.receipt &&
    !receiptOpen &&
    cart.length > 0
  ) {
    setReceiptData(fetcherData.sale.receipt)
    setReceiptOpen(true)
    setCart([])
    setPaymentOpen(false)
  }

  const customers =
    customerFetcher.data && 'customers' in customerFetcher.data
      ? (customerFetcher.data.customers as Array<{
          id: string
          name: string
          nit: string | null
        }>)
      : []

  return (
    <>
      <PosHeader terminalName={terminal.name} cashierName={cashierName} />

      <div className='flex flex-1 overflow-hidden'>
        {/* Left panel: Products */}
        <div className='flex flex-1 flex-col gap-3 overflow-hidden border-r p-4'>
          <PosProductSearch
            value={search}
            onChange={setSearch}
            onBarcodeScanned={handleBarcodeScan}
          />
          <PosProductGrid
            products={filteredProducts}
            categories={categories}
            selectedCategoryId={selectedCategoryId}
            onCategoryChange={setSelectedCategoryId}
            onProductClick={addToCart}
          />
        </div>

        {/* Right panel: Cart */}
        <div className='flex w-80 flex-col border-l lg:w-96'>
          <div className='border-b p-3'>
            <PosCustomerSearch
              selectedCustomer={selectedCustomer}
              customers={customers}
              onSearch={handleCustomerSearch}
              onSelect={setSelectedCustomer}
            />
          </div>

          {fetcherData && 'error' in fetcherData && fetcherData.error && (
            <div className='mx-4 mt-2 rounded-md bg-red-50 p-2 text-sm text-red-600 dark:bg-red-950/30'>
              {fetcherData.error}
            </div>
          )}

          <PosCart
            items={cart}
            totals={totals}
            onQuantityChange={handleQuantityChange}
            onRemoveItem={handleRemoveItem}
            onCheckout={() => setPaymentOpen(true)}
          />
        </div>
      </div>

      <PosPaymentDialog
        open={paymentOpen}
        onOpenChange={setPaymentOpen}
        total={totals.total}
        onConfirm={handleCheckout}
        isSubmitting={fetcher.state === 'submitting'}
      />

      <PosReceiptPreview
        open={receiptOpen}
        onOpenChange={setReceiptOpen}
        receipt={receiptData}
      />

      {/* Print styles */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #pos-receipt, #pos-receipt * { visibility: visible; }
          #pos-receipt {
            position: absolute;
            left: 0;
            top: 0;
            width: 80mm;
            padding: 4mm;
          }
        }
      `}</style>
    </>
  )
}
