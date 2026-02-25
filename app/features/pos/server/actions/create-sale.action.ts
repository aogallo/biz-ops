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
import type { CheckoutInput } from '../../schemas'
import { calculateLineTotals } from '../../types'

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

  const result = await db.transaction(async (tx) => {
    // 1. Lock and validate stock for STOCK products (SELECT FOR UPDATE prevents race conditions)
    for (const line of input.lines) {
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

    // 3. Calculate totals
    let saleSubtotal = 0
    let saleIvaAmount = 0
    let saleDiscountAmount = 0
    let saleTotal = 0

    const lineData = input.lines.map((line, index) => {
      const totals = calculateLineTotals({
        ...line,
        stock: null,
      })

      saleSubtotal += totals.subtotal
      saleIvaAmount += totals.ivaAmount
      saleDiscountAmount += totals.discountAmount
      saleTotal += totals.total

      return {
        lineNumber: index + 1,
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
      }
    })

    // 4. Insert pos_sale
    const [sale] = await tx
      .insert(posSaleModel)
      .values({
        organizationId: input.organizationId,
        companyId: input.companyId,
        terminalId: input.terminalId,
        cashierId: input.cashierId,
        sessionId: input.sessionId,
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
        reference: payment.reference ?? null,
      }))
    )

    // 7. Create stock movements for STOCK products
    for (const line of input.lines) {
      if (line.productType === 'STOCK') {
        await tx.insert(stockMovementModel).values({
          organizationId: input.organizationId,
          productId: line.productId,
          type: 'exit',
          quantity: line.quantity,
          reason: `POS Sale ${saleNumber}`,
          referenceType: 'pos_sale',
          referenceId: sale.id,
          createdById: input.userId ?? null,
        })

        // Decrement stock atomically with safety check
        const updatedResult = await tx.execute<{ id: string }>(
          sql`UPDATE ${productModel} SET stock = stock - ${line.quantity}, updated_at = NOW() WHERE id = ${line.productId} AND stock >= ${line.quantity} RETURNING id`
        )
        const updated = updatedResult.rows[0]

        if (!updated) {
          throw new Error(
            `Stock conflict for "${line.productName}". Another transaction modified the stock.`
          )
        }
      }
    }

    // 8. Create cash movements for cash payments if session exists
    if (input.sessionId) {
      const cashPaymentTotal = input.payments
        .filter((p) => p.method === 'cash')
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
      posPrefix: orgConfig.posPrefix,
      nextPosSaleNumber: orgConfig.nextPosSaleNumber,
      defaultSalesAccountId: orgConfig.defaultSalesAccountId,
      lineData,
      saleSubtotal,
      saleIvaAmount,
      saleTotal,
    }
  })

  // 9. Auto-generate invoice OUTSIDE the main transaction (reduces lock duration)
  await generateInvoiceIfConfigured(input, result)

  return { saleId: result.saleId, saleNumber: result.saleNumber }
}

async function generateInvoiceIfConfigured(
  input: CheckoutInput,
  saleResult: {
    saleId: string
    saleNumber: string
    posPrefix: string | null
    nextPosSaleNumber: number
    defaultSalesAccountId: string | null
    lineData: Array<{
      lineNumber: number
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

  const invoiceNumber = `${saleResult.posPrefix}-INV-${String(saleResult.nextPosSaleNumber).padStart(6, '0')}`

  const [invoice] = await db
    .insert(invoiceModel)
    .values({
      organizationId: input.organizationId,
      companyId: input.companyId,
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
    })
    .returning()

  // Insert invoice lines
  await db.insert(invoiceLineModel).values(
    saleResult.lineData.map((line) => ({
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
