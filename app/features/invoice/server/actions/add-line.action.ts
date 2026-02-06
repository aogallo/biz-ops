import { invoiceRepository } from '../repository'
import type { AddInvoiceLineInput } from '../../schemas'
import type { InvoiceLine } from '~/server/db/schemas/invoice'

export interface AddInvoiceLineResult {
  success: boolean
  line?: InvoiceLine
  error?: string
}

/**
 * Calculate line amounts based on quantity, unit price, and IVA settings
 */
function calculateLineAmounts(
  quantity: number,
  unitPrice: number,
  ivaType: 'taxed' | 'exempt' | 'non_subject',
  ivaRate: number
): {
  subtotal: string
  ivaAmount: string
  total: string
} {
  const subtotal = quantity * unitPrice

  // IVA is only applied if the line is taxed
  const ivaAmount = ivaType === 'taxed' ? subtotal * (ivaRate / 100) : 0

  const total = subtotal + ivaAmount

  return {
    subtotal: subtotal.toFixed(2),
    ivaAmount: ivaAmount.toFixed(2),
    total: total.toFixed(2),
  }
}

export async function addInvoiceLineAction(
  input: AddInvoiceLineInput
): Promise<AddInvoiceLineResult> {
  try {
    // Get the invoice first to check status
    const existing = await invoiceRepository.getById(input.invoiceId)

    if (!existing) {
      return {
        success: false,
        error: 'Invoice not found',
      }
    }

    if (existing.status !== 'draft') {
      return {
        success: false,
        error: 'Lines can only be added to draft invoices',
      }
    }

    // Calculate amounts
    const amounts = calculateLineAmounts(
      input.quantity,
      input.unitPrice,
      input.ivaType,
      input.ivaRate
    )

    const line = await invoiceRepository.addLine(input.invoiceId, {
      description: input.description,
      quantity: String(input.quantity),
      unitPrice: String(input.unitPrice),
      ivaType: input.ivaType,
      ivaRate: String(input.ivaRate),
      productId: input.productId ?? null,
      subtotal: amounts.subtotal,
      ivaAmount: amounts.ivaAmount,
      total: amounts.total,
      lineNumber: 0, // Will be auto-calculated by repository
    })

    return {
      success: true,
      line,
    }
  } catch (error) {
    console.error('Error adding invoice line:', error)
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to add invoice line',
    }
  }
}
