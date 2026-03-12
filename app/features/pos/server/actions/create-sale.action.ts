import { eq, sql } from 'drizzle-orm'
import { db } from '~/server/db'
import {
  posSaleModel,
  posSaleLineModel,
  posPaymentModel,
  posTerminalModel,
  posCashMovementModel,
} from '~/server/db/schemas/pos'
import { productModel } from '~/server/db/schemas/products'
import { stockMovementModel } from '~/server/db/schemas/stockMovement'
import { organizationAccountingConfigModel } from '~/server/db/schemas/organizationConfig'
import { invoiceModel, invoiceLineModel } from '~/server/db/schemas/invoice'
import {
  sucursalModel,
  sucursalInventoryModel,
} from '~/server/db/schemas/sucursal'
import type { CheckoutInput } from '../../schemas'
import { calculateLineTotals } from '../../types'
import { posRepository } from '../repository'
import { resolveInventoryDecrements } from '../utils/inventory-resolver'
import { recipeRepository } from '~/features/recipe/server/repository'
import { createKitchenTicketAction } from '~/features/kitchen/server/actions/create-kitchen-ticket.action'

export async function createSaleAction(input: CheckoutInput) {
  // Check idempotency — return existing sale if already processed
  const [existingSale] = await db
    .select({ id: posSaleModel.id, saleNumber: posSaleModel.saleNumber })
    .from(posSaleModel)
    .where(eq(posSaleModel.idempotencyKey, input.idempotencyKey))
    .limit(1)

  if (existingSale) {
    return { saleId: existingSale.id, saleNumber: existingSale.saleNumber }
  }

  // Pre-generate DB UUIDs for all lines to resolve parent line IDs
  // Map from clientId (cartItemId) → generated DB UUID
  const clientIdToDbId = new Map<string, string>()

  for (const line of input.lines) {
    const newId = crypto.randomUUID()
    if (line.parentLineClientId) {
      // This is a child line — we'll resolve its parentLineId from the map
    }
    // Every line gets a pre-generated ID
    clientIdToDbId.set(
      // We use productId + lineType as a composite key for combo parent lookup
      // But we need to track by the client-sent parentLineClientId reference
      // The combo parent sends its own cartItemId as parentLineClientId on children
      line.productId +
        (line.lineType ?? 'product') +
        (line.parentLineClientId ?? ''),
      newId
    )
  }

  // Parent line ID resolution strategy:
  // combo lines (lineType='combo') are identified by their productId (comboTemplateId)
  // Build map: for each line that might be a parent, map its "identity" to its DB id
  // We use parentLineClientId which is the cartItemId of the parent
  // But we don't have cartItemIds in input.lines — only parentLineClientId on children
  // So we need to find which line is the parent by matching combo lines
  // Strategy: combo lines are lineType='combo'. Children have parentLineClientId pointing to the combo.
  // Since the client already resolves the parentLineClientId as a UUID, we can't match it directly.
  // However, looking at the plan: "Client sends cartItemId as the parentLineClientId"
  // And we only need to resolve within the same batch of lines.
  // The simplest approach: pass the parentLineClientId as is in the request,
  // and in the action, find which line in input.lines is the "parent" by matching combo lines.
  // But we can't match by cartItemId since that's client-side only.
  //
  // REVISED STRATEGY per the plan:
  // The client sends parentLineClientId which is a client-side cartItemId.
  // We need a way to map it. The plan says:
  // "Build Map<cartItemId, generatedDbUUID> before inserting"
  // This means the client MUST send its cartItemId in the line data for combo parents.
  // We add cartItemId to the line schema as an optional field for this purpose.
  //
  // For now, since cartItemId is not in the checkout schema yet,
  // we'll use position-based resolution: combo lines come before their children,
  // and we match by comboTemplateId + lineType.

  const result = await db.transaction(async (tx) => {
    // 1. Lock and validate stock for STOCK/trackInventory products
    for (const line of input.lines) {
      const lineType = line.lineType ?? 'product'
      const trackInventory = line.trackInventory ?? true

      // Skip combo header lines and non-tracked inventory
      if (
        line.productType === 'combo' ||
        lineType === 'combo' ||
        !trackInventory
      ) {
        continue
      }

      // Only validate direct stock for STOCK-type products (not recipes which expand to ingredients)
      if (line.productType === 'STOCK') {
        const productResult = await tx.execute<{
          id: string
          stock: number
          name: string
        }>(
          sql`SELECT id, stock, name FROM ${productModel} WHERE id = ${line.productId} LIMIT 1 FOR UPDATE`
        )
        const product = productResult.rows[0]

        if (!product) {
          throw new Error(`Product not found: ${line.productName}`)
        }

        const currentStock = product.stock ?? 0
        if (currentStock < line.quantity) {
          throw new Error(
            `Insufficient stock for "${product.name}". Available: ${currentStock}, Requested: ${line.quantity}`
          )
        }
      }
    }

    // 2. Generate sale number
    const [orgConfig] = await tx
      .select()
      .from(organizationAccountingConfigModel)
      .where(
        eq(
          organizationAccountingConfigModel.organizationId,
          input.organizationId
        )
      )
      .limit(1)

    if (!orgConfig) {
      throw new Error('Organization accounting config not found')
    }

    const saleNumber = `${orgConfig.posPrefix}-${String(orgConfig.nextPosSaleNumber).padStart(6, '0')}`

    // Increment sale number
    await tx
      .update(organizationAccountingConfigModel)
      .set({
        nextPosSaleNumber: orgConfig.nextPosSaleNumber + 1,
        updatedAt: new Date(),
      })
      .where(eq(organizationAccountingConfigModel.id, orgConfig.id))

    // 3. Calculate totals (skip combo_item lines to avoid double-counting)
    let saleSubtotal = 0
    let saleIvaAmount = 0
    let saleDiscountAmount = 0
    let saleTotal = 0

    // Build parentLineId resolution map:
    // For each combo line (lineType='combo'), assign a pre-generated DB ID
    // Children reference their parent by parentLineClientId
    // We need to match client cartItemIds to DB UUIDs
    // Since we don't have cartItemId in the schema yet, use a positional approach:
    // combo lines are identified by lineType='combo', assign them DB IDs in order
    // children use parentLineClientId which should match the combo's position

    // Assign a pre-generated UUID to each line
    const dbLineIds = input.lines.map(() => crypto.randomUUID())

    // Build map from parentLineClientId → dbLineId
    // We need the client to send something we can match. For now, we'll use the
    // comboTemplateId as the matching key for parent resolution.
    // Each combo line has lineType='combo' and a unique comboTemplateId (its productId).
    // Children have parentLineClientId set to the combo's cartItemId.
    // Since we can't match cartItemIds, we'll store parentLineId as null for now
    // and rely on comboTemplateId for grouping in queries.
    // TODO: Add cartItemId to checkoutLineSchema for proper resolution

    const lineData = input.lines.map((line, index) => {
      const lineType = line.lineType ?? 'product'

      // For combo_item lines, don't count in totals (price absorbed in combo line)
      const totals =
        lineType === 'combo_item'
          ? { subtotal: 0, discountAmount: 0, ivaAmount: 0, total: 0 }
          : calculateLineTotals({ ...line, stock: null })

      if (lineType !== 'combo_item') {
        saleSubtotal += totals.subtotal
        saleIvaAmount += totals.ivaAmount
        saleDiscountAmount += totals.discountAmount
        saleTotal += totals.total
      }

      return {
        id: dbLineIds[index],
        lineNumber: index + 1,
        lineType: lineType as 'product' | 'combo' | 'combo_item',
        parentLineId: null as string | null, // resolved below
        comboTemplateId: line.comboTemplateId ?? null,
        productId: line.productId,
        productName: line.productName,
        productSku: line.productSku,
        quantity: String(line.quantity),
        unitPrice: String(line.unitPrice),
        discountPercent: String(line.discountPercent),
        discountAmount: String(totals.discountAmount),
        subtotal: String(totals.subtotal),
        ivaType: line.ivaType as 'taxed' | 'exempt' | 'non_subject',
        ivaRate: String(line.ivaRate),
        ivaAmount: String(totals.ivaAmount),
        total: String(totals.total),
        modificationsJson: line.modificationsJson ?? null,
      }
    })

    // Resolve parentLineId for combo_item lines
    // Find the combo parent line and assign its DB id to children
    const comboLinesByTemplateId = new Map<string, string>()
    for (let i = 0; i < input.lines.length; i++) {
      if ((input.lines[i].lineType ?? 'product') === 'combo') {
        comboLinesByTemplateId.set(input.lines[i].productId, dbLineIds[i])
      }
    }
    for (let i = 0; i < input.lines.length; i++) {
      if ((input.lines[i].lineType ?? 'product') === 'combo_item') {
        const parentTemplateId = input.lines[i].comboTemplateId
        if (parentTemplateId) {
          lineData[i].parentLineId =
            comboLinesByTemplateId.get(parentTemplateId) ?? null
        }
      }
    }

    // 4. Insert pos_sale
    const [sale] = await tx
      .insert(posSaleModel)
      .values({
        organizationId: input.organizationId,
        sucursalId: input.sucursalId,
        companyId: input.companyId ?? null,
        terminalId: input.terminalId,
        cashierId: input.cashierId,
        sessionId: input.sessionId,
        tableId: input.tableId ?? null,
        orderType: input.orderType ?? 'takeout',
        coverCount: input.coverCount ?? null,
        businessPartnerId: input.businessPartnerId,
        saleNumber,
        idempotencyKey: input.idempotencyKey,
        status: 'completed',
        subtotal: String(saleSubtotal),
        ivaAmount: String(saleIvaAmount),
        discountAmount: String(saleDiscountAmount),
        total: String(saleTotal),
        notes: input.notes,
      })
      .returning()

    // 5. Insert sale lines
    await tx.insert(posSaleLineModel).values(
      lineData.map((line) => ({
        ...line,
        saleId: sale.id,
      }))
    )

    // 6. Insert payments
    await tx.insert(posPaymentModel).values(
      input.payments.map((payment) => ({
        saleId: sale.id,
        method: payment.method,
        amount: String(payment.amount),
        receivedAmount: payment.receivedAmount
          ? String(payment.receivedAmount)
          : null,
        changeAmount: payment.changeAmount
          ? String(payment.changeAmount)
          : null,
        exchangeRate: payment.exchangeRate
          ? String(payment.exchangeRate)
          : null,
        reference: payment.reference ?? null,
      }))
    )

    // 7. Resolve inventory decrements (handles combo expansion, recipe expansion, trackInventory)
    const decrements = await resolveInventoryDecrements(
      input.lines.map((l) => ({
        productId: l.productId,
        productName: l.productName,
        quantity: l.quantity,
        productType: l.productType,
        lineType: l.lineType ?? 'product',
        trackInventory: l.trackInventory ?? true,
        removedIngredientIds: l.removedIngredientIds ?? [],
      })),
      {
        sucursalId: input.sucursalId ?? null,
        organizationId: input.organizationId,
        referenceType: 'pos_sale',
        referenceId: sale.id,
      },
      {
        expandRecipeToIngredients: (
          productId,
          multiplier,
          removedIngredientIds
        ) =>
          recipeRepository.expandRecipeToIngredients(
            productId,
            multiplier,
            removedIngredientIds
          ),
        getProductType: async (productId) => {
          const [p] = await tx
            .select({ productType: productModel.productType })
            .from(productModel)
            .where(eq(productModel.id, productId))
            .limit(1)
          return p?.productType ?? null
        },
      }
    )

    for (const decrement of decrements) {
      // Insert stock movement
      await tx.insert(stockMovementModel).values({
        organizationId: input.organizationId,
        productId: decrement.productId,
        type: 'exit',
        quantity: decrement.quantity,
        reason: `POS Sale ${saleNumber}`,
        referenceType: 'pos_sale',
        referenceId: sale.id,
        createdById: input.userId ?? null,
      })

      // Decrement global product stock atomically
      await tx.execute(
        sql`UPDATE ${productModel} SET stock = stock - ${decrement.quantity}, updated_at = NOW() WHERE id = ${decrement.productId} AND stock >= ${decrement.quantity}`
      )

      // Decrement sucursal inventory if available
      if (decrement.sucursalId) {
        await tx.execute(
          sql`UPDATE ${sucursalInventoryModel}
              SET stock = stock - ${decrement.quantity}, updated_at = NOW()
              WHERE sucursal_id = ${decrement.sucursalId}
                AND product_id = ${decrement.productId}
                AND stock >= ${decrement.quantity}`
        )
      }
    }

    // 8. Create cash movements for cash + cash_usd payments if session exists
    if (input.sessionId) {
      const cashPaymentTotal = input.payments
        .filter((p) => p.method === 'cash' || p.method === 'cash_usd')
        .reduce((sum, p) => sum + p.amount, 0)

      if (cashPaymentTotal > 0) {
        await tx.insert(posCashMovementModel).values({
          sessionId: input.sessionId,
          type: 'sale',
          amount: String(cashPaymentTotal),
          referenceId: sale.id,
          notes: `Sale ${saleNumber}`,
        })
      }
    }

    return {
      saleId: sale.id,
      saleNumber,
      defaultSalesAccountId: orgConfig.defaultSalesAccountId,
      lineData,
      saleSubtotal,
      saleIvaAmount,
      saleTotal,
    }
  })

  // 9. Auto-generate invoice OUTSIDE the main transaction (reduces lock duration)
  await generateInvoiceIfConfigured(input, result)

  // 10. Create kitchen ticket (outside transaction — non-blocking)
  if (input.sucursalId) {
    const kitchenItems = result.lineData
      .filter((l) => l.lineType !== 'combo_item')
      .map((l) => ({
        productId: l.productId,
        productName: l.productName,
        quantity: Number(l.quantity),
        stationId: null,
        modificationsJson: l.modificationsJson ?? null,
      }))

    if (kitchenItems.length > 0) {
      await createKitchenTicketAction({
        organizationId: input.organizationId,
        sucursalId: input.sucursalId,
        saleId: result.saleId,
        notes: input.notes ?? null,
        items: kitchenItems,
      })
    }
  }

  // 11. Release table if this was a dine-in order
  if (input.tableId) {
    const { posTablesRepository } =
      await import('~/features/pos/server/repository/tables.repository')
    await posTablesRepository.updateTableStatus(input.tableId, 'available')
  }

  return { saleId: result.saleId, saleNumber: result.saleNumber }
}

async function generateInvoiceIfConfigured(
  input: CheckoutInput,
  saleResult: {
    saleId: string
    saleNumber: string
    defaultSalesAccountId: string | null
    lineData: Array<{
      lineNumber: number
      lineType: string
      productId: string
      productName: string
      productSku: string
      quantity: string
      unitPrice: string
      subtotal: string
      ivaType: 'taxed' | 'exempt' | 'non_subject'
      ivaRate: string
      ivaAmount: string
      total: string
    }>
    saleSubtotal: number
    saleIvaAmount: number
    saleTotal: number
  }
) {
  const [terminal] = await db
    .select({
      autoGenerateInvoice: posTerminalModel.autoGenerateInvoice,
    })
    .from(posTerminalModel)
    .where(eq(posTerminalModel.id, input.terminalId))
    .limit(1)

  if (!terminal?.autoGenerateInvoice) return

  const defaultAccountId = saleResult.defaultSalesAccountId
  if (!defaultAccountId) return

  // Resolve companyId: prefer terminal's direct companyId, fall back to sucursal's company
  let companyId: string | null = input.companyId ?? null
  if (!companyId && input.sucursalId) {
    const [sucursal] = await db
      .select({ companyId: sucursalModel.companyId })
      .from(sucursalModel)
      .where(eq(sucursalModel.id, input.sucursalId))
      .limit(1)
    companyId = sucursal?.companyId ?? null
  }

  if (!companyId) return // Cannot generate invoice without a company

  const { formatted: invoiceNumber } =
    await posRepository.getNextTerminalInvoiceNumber(input.terminalId)

  const [invoice] = await db
    .insert(invoiceModel)
    .values({
      organizationId: input.organizationId,
      companyId,
      businessPartnerId: input.businessPartnerId,
      accountingAccountId: defaultAccountId,
      type: 'sale',
      number: invoiceNumber,
      invoiceDate: new Date().toISOString().split('T')[0],
      subtotal: String(saleResult.saleSubtotal),
      ivaAmount: String(saleResult.saleIvaAmount),
      total: String(saleResult.saleTotal),
      status: 'posted',
      source: 'manual',
      sucursalId: input.sucursalId ?? null,
      terminalId: input.terminalId,
    })
    .returning()

  // Insert invoice lines — skip combo_item lines (price absorbed in combo line)
  const billableLines = saleResult.lineData.filter(
    (l) => l.lineType !== 'combo_item'
  )

  await db.insert(invoiceLineModel).values(
    billableLines.map((line) => ({
      invoiceId: invoice.id,
      lineNumber: line.lineNumber,
      description: `${line.productName} (${line.productSku})`,
      quantity: line.quantity,
      unitPrice: line.unitPrice,
      subtotal: line.subtotal,
      ivaType: line.ivaType,
      ivaRate: line.ivaRate,
      ivaAmount: line.ivaAmount,
      total: line.total,
      productId: line.productId,
      lineType: 'goods' as const,
    }))
  )

  // Link invoice to sale
  await db
    .update(posSaleModel)
    .set({ invoiceId: invoice.id, updatedAt: new Date() })
    .where(eq(posSaleModel.id, saleResult.saleId))
}
