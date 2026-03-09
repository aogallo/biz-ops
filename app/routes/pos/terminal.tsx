import { useState, useCallback, useRef, useEffect } from 'react'
import { useFetcher, redirect, useNavigate } from 'react-router'
import { toast } from 'sonner'
import { posRepository } from '~/features/pos/server/repository'
import { createSaleAction } from '~/features/pos/server/actions/create-sale.action'
import { openSessionAction } from '~/features/pos/server/actions/open-session.action'
import { closeSessionAction } from '~/features/pos/server/actions/close-session.action'
import { cashMovementAction } from '~/features/pos/server/actions/cash-movement.action'
import {
  checkoutSchema,
  openSessionSchema,
  closeSessionSchema,
  cashMovementSchema,
} from '~/features/pos/schemas'
import { PosHeader } from '~/features/pos/components/PosHeader'
import { PosProductSearch } from '~/features/pos/components/PosProductSearch'
import { PosProductGrid } from '~/features/pos/components/PosProductGrid'
import { PosCart } from '~/features/pos/components/PosCart'
import { PosCustomerSearch } from '~/features/pos/components/PosCustomerSearch'
import { PosPaymentDialog } from '~/features/pos/components/PosPaymentDialog'
import { PosReceiptPreview } from '~/features/pos/components/PosReceiptPreview'
import { PosOpenShiftDialog } from '~/features/pos/components/PosOpenShiftDialog'
import { PosCloseShiftDialog } from '~/features/pos/components/PosCloseShiftDialog'
import { PosCashMovementDialog } from '~/features/pos/components/PosCashMovementDialog'
import { PosCreateCustomerDialog } from '~/features/pos/components/PosCreateCustomerDialog'
import { PosProductAttributesDialog } from '~/features/pos/components/PosProductAttributesDialog'
import type { ReceiptData } from '~/features/pos/components/PosReceiptPreview'
import { buildReceiptHtml, printWithIframe } from '~/features/pos/utils/receipt-html'
import { printWithQz } from '~/features/pos/utils/qz-print'
import {
  type CartItem,
  type PosProductForGrid,
  calculateCartTotals,
} from '~/features/pos/types'
import type { CheckoutPayment } from '~/features/pos/schemas'
import { getOptionalAuth } from '~/server/auth/session.server'
import { getPosSession } from '~/server/auth/pos-session.server'
import { isStaleSession } from '~/features/pos/server/utils/session-date'
import { autoCloseStaleSessionAction } from '~/features/pos/server/actions/auto-close-stale-session.action'
import { useTranslation } from '~/i18n/context'
import { businessPartnerModel } from '~/server/db/schemas/businessPartner'
import { db } from '~/server/db'
import { and, eq } from 'drizzle-orm'
import type { Route } from './+types/terminal'

export async function loader({ request }: Route.LoaderArgs) {
  const [userSession, posSession] = await Promise.all([
    getOptionalAuth(request),
    getPosSession(request),
  ])

  if (!userSession && !posSession) {
    throw redirect('/pos-login')
  }

  const organizationId =
    posSession?.organizationId ?? userSession?.session.activeOrganizationId

  const url = new URL(request.url)
  const terminalId = url.searchParams.get('terminalId')

  if (!organizationId || !terminalId) {
    throw redirect('/pos')
  }

  const terminal = await posRepository.getTerminalById(terminalId)
  if (!terminal || terminal.organizationId !== organizationId) {
    throw redirect('/pos')
  }

  // Resolve cashier entity from POS session or user account
  let cashier = null
  if (posSession) {
    cashier = await posRepository.getCashierById(posSession.cashierId)
  } else if (userSession) {
    cashier = await posRepository.getCashierByUserId(
      organizationId,
      userSession.user.id
    )
  }

  // Get open session for this terminal — auto-close if stale (from a previous day)
  let openSession: Awaited<ReturnType<typeof posRepository.getOpenSession>> | null =
    await posRepository.getOpenSession(terminalId)
  let autoClosedStaleSession = false

  if (openSession && isStaleSession(new Date(openSession.openedAt))) {
    const result = await autoCloseStaleSessionAction(openSession.id)
    if (result.closed) {
      autoClosedStaleSession = true
      openSession = null
    }
  }

  const sucursalId = terminal.sucursalId ?? undefined

  const [products, categories, expectedCash] = await Promise.all([
    posRepository.getProductsForPos(organizationId, sucursalId),
    posRepository.getCategories(organizationId),
    openSession
      ? posRepository.calculateExpectedCashForSession(openSession.id)
      : Promise.resolve(0),
  ])

  const cashierName = posSession?.cashierName ?? userSession?.user.name ?? ''
  const userId = userSession?.user.id ?? null

  let defaultBusinessPartnerId = terminal.defaultBusinessPartnerId ?? null

  if (!defaultBusinessPartnerId) {
    const [cfPartner] = await db
      .select({ id: businessPartnerModel.id })
      .from(businessPartnerModel)
      .where(
        and(
          eq(businessPartnerModel.organizationId, organizationId),
          eq(businessPartnerModel.nit, 'CF')
        )
      )
      .limit(1)
    defaultBusinessPartnerId = cfPartner?.id ?? null
  }

  return {
    terminal,
    products,
    categories,
    cashierId: cashier?.id ?? '',
    cashierName,
    organizationId,
    userId,
    defaultBusinessPartnerId,
    cashier,
    openSession,
    autoClosedStaleSession,
    expectedCash,
  }
}

export async function action({ request }: Route.ActionArgs) {
  const [userSession, posSession] = await Promise.all([
    getOptionalAuth(request),
    getPosSession(request),
  ])

  if (!userSession && !posSession) {
    throw redirect('/pos-login')
  }

  const organizationId =
    posSession?.organizationId ?? userSession?.session.activeOrganizationId

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
                printerName: sale.terminal?.printerName ?? null,
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
        error: error instanceof Error ? error.message : 'Error processing sale',
      }
    }
  }

  if (intent === 'search-customers') {
    const query = formData.get('query')
    if (!organizationId || !query || typeof query !== 'string') {
      return { customers: [] }
    }
    const customers = await posRepository.searchBusinessPartners(
      organizationId,
      query
    )
    return { customers }
  }

  if (intent === 'open-session') {
    const rawData = formData.get('data')
    if (!rawData || typeof rawData !== 'string') {
      return { error: 'Invalid data' }
    }

    const parsed = openSessionSchema.safeParse(JSON.parse(rawData))
    if (!parsed.success) {
      return { error: 'Validation failed' }
    }

    try {
      await openSessionAction(parsed.data)
      return { success: true, intent: 'open-session' }
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Error opening session',
      }
    }
  }

  if (intent === 'close-session') {
    const rawData = formData.get('data')
    if (!rawData || typeof rawData !== 'string') {
      return { error: 'Invalid data' }
    }

    const parsed = closeSessionSchema.safeParse(JSON.parse(rawData))
    if (!parsed.success) {
      return { error: 'Validation failed' }
    }

    try {
      const result = await closeSessionAction(parsed.data)
      return {
        success: true,
        intent: 'close-session',
        zReportId: result.zReportId,
      }
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Error closing session',
      }
    }
  }

  if (intent === 'cash-movement') {
    const rawData = formData.get('data')
    if (!rawData || typeof rawData !== 'string') {
      return { error: 'Invalid data' }
    }

    const parsed = cashMovementSchema.safeParse(JSON.parse(rawData))
    if (!parsed.success) {
      return { error: 'Validation failed' }
    }

    try {
      await cashMovementAction(parsed.data)
      return { success: true, intent: 'cash-movement' }
    } catch (error) {
      return {
        error:
          error instanceof Error ? error.message : 'Error registering movement',
      }
    }
  }

  if (intent === 'create-customer') {
    const name = formData.get('name')
    const nit = formData.get('nit')

    if (!organizationId || !name || typeof name !== 'string') {
      return { error: 'Name is required' }
    }

    try {
      const [customer] = await db
        .insert(businessPartnerModel)
        .values({
          organizationId,
          name,
          nit: typeof nit === 'string' && nit ? nit : 'CF',
          type: 'client',
        })
        .returning()

      return {
        success: true,
        intent: 'create-customer',
        customer: { id: customer.id, name: customer.name, nit: customer.nit },
      }
    } catch (error) {
      return {
        error:
          error instanceof Error ? error.message : 'Error creating customer',
      }
    }
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
    userId,
    defaultBusinessPartnerId,
    cashier,
    openSession,
    autoClosedStaleSession,
    expectedCash,
  } = loaderData

  const { t } = useTranslation()

  useEffect(() => {
    if (autoClosedStaleSession) {
      toast.warning(
        'Tu turno anterior fue cerrado automáticamente al cambiar de día. Abre un nuevo turno para continuar.'
      )
    }
  }, [autoClosedStaleSession])
  const navigate = useNavigate()
  const fetcher = useFetcher<typeof action>()
  const customerFetcher = useFetcher<typeof action>()

  const [cart, setCart] = useState<CartItem[]>([])
  const [selectedCartItemId, setSelectedCartItemId] = useState<string | null>(null)
  const [numpadInput, setNumpadInput] = useState('')
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
  const processedSaleRef = useRef<string | null>(null)
  const [closeShiftOpen, setCloseShiftOpen] = useState(false)
  const [cashMovementOpen, setCashMovementOpen] = useState(false)
  const [createCustomerOpen, setCreateCustomerOpen] = useState(false)
  const [attributeDialogProduct, setAttributeDialogProduct] = useState<PosProductForGrid | null>(null)

  // No cashier profile
  if (!cashier) {
    return (
      <div className='flex flex-1 flex-col items-center justify-center p-8'>
        <div className='text-center'>
          <h2 className='text-xl font-bold'>{t('pos.noCashier')}</h2>
          <p className='text-muted-foreground mt-2'>
            {t('pos.noCashierDescription')}
          </p>
        </div>
      </div>
    )
  }

  const needsOpenShift = !openSession

  const filteredProducts = initialProducts.filter((p) => {
    if (selectedCategoryId && p.categoryId !== selectedCategoryId) return false
    if (search) {
      const q = search.toLowerCase()
      return p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)
    }
    return true
  })

  const totals = calculateCartTotals(cart)

  const addToCart = useCallback(
    (
      product: PosProductForGrid,
      selectedAttributes?: Record<string, string>,
      priceAdjustment = 0
    ) => {
      const attrsKey = JSON.stringify(selectedAttributes ?? {})
      setCart((prev) => {
        const existing = prev.find(
          (item) =>
            item.productId === product.id &&
            JSON.stringify(item.selectedAttributes ?? {}) === attrsKey
        )
        if (existing) {
          const max =
            product.productType === 'STOCK' && product.stock !== null
              ? product.stock
              : Infinity
          if (existing.quantity >= max) return prev
          setSelectedCartItemId(existing.cartItemId)
          return prev.map((item) =>
            item.cartItemId === existing.cartItemId
              ? { ...item, quantity: item.quantity + 1 }
              : item
          )
        }
        const newCartItemId = crypto.randomUUID()
        setSelectedCartItemId(newCartItemId)
        return [
          ...prev,
          {
            cartItemId: newCartItemId,
            productId: product.id,
            productName: product.name,
            productSku: product.sku,
            unitPrice: Number(product.price) + priceAdjustment,
            quantity: 1,
            discountPercent: 0,
            ivaType: 'taxed' as const,
            ivaRate: 12,
            productType: product.productType as 'STOCK' | 'MADE_TO_ORDER' | 'SERVICE',
            stock: product.stock,
            selectedAttributes,
          },
        ]
      })
      setNumpadInput('')
    },
    []
  )

  const handleProductClick = useCallback(
    (product: PosProductForGrid) => {
      if (product.attributesJson?.attributes?.length) {
        setAttributeDialogProduct(product)
      } else {
        addToCart(product)
      }
    },
    [addToCart]
  )

  const handleAttributesConfirm = useCallback(
    (
      product: PosProductForGrid,
      selectedAttributes: Record<string, string>,
      priceAdjustment: number
    ) => {
      addToCart(product, selectedAttributes, priceAdjustment)
      setAttributeDialogProduct(null)
    },
    [addToCart]
  )

  const handleItemSelect = useCallback((cartItemId: string) => {
    setSelectedCartItemId(cartItemId)
    setNumpadInput('')
  }, [])

  const handleNumpadDigit = useCallback(
    (digit: string) => {
      if (!selectedCartItemId) return
      setNumpadInput((prev) => {
        const next = prev.length >= 4 ? prev : prev + digit
        const qty = parseInt(next, 10)
        if (!isNaN(qty) && qty >= 1) {
          setCart((items) =>
            items.map((item) => {
              if (item.cartItemId !== selectedCartItemId) return item
              const max =
                item.productType === 'STOCK' && item.stock !== null
                  ? item.stock
                  : Infinity
              return { ...item, quantity: Math.min(qty, max) }
            })
          )
        }
        return next
      })
    },
    [selectedCartItemId]
  )

  const handleNumpadBackspace = useCallback(() => {
    if (!selectedCartItemId) return
    setNumpadInput((prev) => {
      const next = prev.slice(0, -1)
      if (next !== '') {
        const qty = parseInt(next, 10)
        if (!isNaN(qty) && qty >= 1) {
          setCart((items) =>
            items.map((item) =>
              item.cartItemId === selectedCartItemId
                ? { ...item, quantity: qty }
                : item
            )
          )
        }
      }
      return next
    })
  }, [selectedCartItemId])

  const handleNumpadClear = useCallback(() => {
    setNumpadInput('')
  }, [])

  const handleQuantityChange = useCallback(
    (cartItemId: string, quantity: number) => {
      setCart((prev) =>
        prev.map((item) =>
          item.cartItemId === cartItemId ? { ...item, quantity } : item
        )
      )
    },
    []
  )

  const handleRemoveItem = useCallback((cartItemId: string) => {
    setCart((prev) => prev.filter((item) => item.cartItemId !== cartItemId))
  }, [])

  const handleBarcodeScan = useCallback(
    (barcode: string) => {
      const product = initialProducts.find((p) => p.sku === barcode)
      if (product) handleProductClick(product)
    },
    [initialProducts, handleProductClick]
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
        alert(t('pos.noCustomerSelected'))
        return
      }

      const data = {
        terminalId: terminal.id,
        organizationId,
        sucursalId: terminal.sucursalId,
        companyId: terminal.companyId,
        cashierId,
        userId,
        businessPartnerId,
        idempotencyKey: crypto.randomUUID(),
        sessionId: openSession?.id,
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
      userId,
      openSession,
      fetcher,
      t,
    ]
  )

  const handleOpenShift = useCallback(
    (openingCashAmount: number) => {
      const data = {
        terminalId: terminal.id,
        organizationId,
        sucursalId: terminal.sucursalId,
        cashierId: cashier.id,
        openingCashAmount,
      }
      fetcher.submit(
        { intent: 'open-session', data: JSON.stringify(data) },
        { method: 'post' }
      )
    },
    [terminal, organizationId, cashier, fetcher]
  )

  const handleCloseShift = useCallback(
    (closingCashAmount: number, notes?: string) => {
      if (!openSession) return
      const data = {
        sessionId: openSession.id,
        closingCashAmount,
        notes,
      }
      fetcher.submit(
        { intent: 'close-session', data: JSON.stringify(data) },
        { method: 'post' }
      )
    },
    [openSession, fetcher]
  )

  const handleCashMovement = useCallback(
    (type: 'withdrawal' | 'deposit', amount: number, notes?: string) => {
      if (!openSession) return
      const data = {
        sessionId: openSession.id,
        type,
        amount,
        notes,
      }
      fetcher.submit(
        { intent: 'cash-movement', data: JSON.stringify(data) },
        { method: 'post' }
      )
    },
    [openSession, fetcher]
  )

  const handleCreateCustomer = useCallback(
    (name: string, nit: string) => {
      fetcher.submit(
        { intent: 'create-customer', name, nit },
        { method: 'post' }
      )
    },
    [fetcher]
  )

  const handlePrint = useCallback(
    async (receipt: ReceiptData) => {
      if (terminal.printMethod === 'qz-tray') {
        const result = await printWithQz(receipt, t)
        if (result.success) return
        console.warn('[QZ Tray] fallback to browser print:', result.reason)
      }
      printWithIframe(buildReceiptHtml(receipt, t))
    },
    [terminal.printMethod, t]
  )

  // Handle close-session success: redirect to /pos terminal selector
  const closedSessionRef = useRef(false)
  useEffect(() => {
    if (
      fetcher.data &&
      'intent' in fetcher.data &&
      fetcher.data.intent === 'close-session' &&
      'success' in fetcher.data &&
      fetcher.data.success &&
      !closedSessionRef.current
    ) {
      closedSessionRef.current = true
      navigate('/pos')
    }
  }, [fetcher.data, navigate])

  // Handle successful checkout
  const fetcherData = fetcher.data
  if (
    fetcherData &&
    'success' in fetcherData &&
    fetcherData.success &&
    'sale' in fetcherData &&
    fetcherData.sale?.receipt &&
    fetcherData.sale.receipt.saleNumber !== processedSaleRef.current
  ) {
    const receipt = fetcherData.sale.receipt
    processedSaleRef.current = receipt.saleNumber
    setReceiptData(receipt)
    setCart([])
    setSelectedCartItemId(null)
    setNumpadInput('')
    setSelectedCustomer(null)
    setPaymentOpen(false)

    if (terminal.autoPrintReceipt) {
      handlePrint(receipt)
    } else {
      setReceiptOpen(true)
    }
  }

  // Handle created customer
  if (
    fetcherData &&
    'success' in fetcherData &&
    fetcherData.success &&
    'intent' in fetcherData &&
    fetcherData.intent === 'create-customer' &&
    'customer' in fetcherData &&
    fetcherData.customer &&
    createCustomerOpen
  ) {
    const c = fetcherData.customer as {
      id: string
      name: string
      nit: string | null
    }
    setSelectedCustomer(c)
    setCreateCustomerOpen(false)
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
      <PosHeader
        terminalName={terminal.name}
        terminalId={terminal.id}
        cashierName={cashierName}
        sessionId={openSession?.id}
        sessionOpenedAt={
          openSession?.openedAt ? String(openSession.openedAt) : null
        }
        onCloseShift={() => setCloseShiftOpen(true)}
        onCashMovement={() => setCashMovementOpen(true)}
      />

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
            onProductClick={handleProductClick}
            sucursalId={terminal.sucursalId}
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
              onCreateCustomer={() => setCreateCustomerOpen(true)}
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
            selectedItemId={selectedCartItemId}
            onItemSelect={handleItemSelect}
            numpadInput={numpadInput}
            onNumpadDigit={handleNumpadDigit}
            onNumpadBackspace={handleNumpadBackspace}
            onNumpadClear={handleNumpadClear}
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
        onPrint={handlePrint}
      />

      <PosOpenShiftDialog
        open={needsOpenShift}
        onConfirm={handleOpenShift}
        onCancel={() => navigate('/pos')}
        isSubmitting={fetcher.state === 'submitting'}
      />

      <PosCloseShiftDialog
        open={closeShiftOpen}
        onOpenChange={setCloseShiftOpen}
        onConfirm={handleCloseShift}
        isSubmitting={fetcher.state === 'submitting'}
        expectedCash={expectedCash}
      />

      <PosCashMovementDialog
        open={cashMovementOpen}
        onOpenChange={setCashMovementOpen}
        onConfirm={handleCashMovement}
        isSubmitting={fetcher.state === 'submitting'}
      />

      <PosCreateCustomerDialog
        open={createCustomerOpen}
        onOpenChange={setCreateCustomerOpen}
        onConfirm={handleCreateCustomer}
        isSubmitting={fetcher.state === 'submitting'}
      />

      <PosProductAttributesDialog
        product={attributeDialogProduct}
        open={attributeDialogProduct !== null}
        onOpenChange={(open) => { if (!open) setAttributeDialogProduct(null) }}
        onConfirm={handleAttributesConfirm}
      />

    </>
  )
}
