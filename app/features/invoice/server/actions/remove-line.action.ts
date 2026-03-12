import { invoiceRepository } from '../repository'

export interface RemoveInvoiceLineResult {
  success: boolean
  error?: string
}

export async function removeInvoiceLineAction(
  lineId: string,
  invoiceId: string
): Promise<RemoveInvoiceLineResult> {
  try {
    // Get the invoice first to check status
    const existing = await invoiceRepository.getById(invoiceId)

    if (!existing) {
      return {
        success: false,
        error: 'Invoice not found',
      }
    }

    if (existing.status !== 'draft') {
      return {
        success: false,
        error: 'Lines can only be removed from draft invoices',
      }
    }

    const removed = await invoiceRepository.removeLine(lineId)

    if (!removed) {
      return {
        success: false,
        error: 'Failed to remove invoice line',
      }
    }

    return {
      success: true,
    }
  } catch (error) {
    console.error('Error removing invoice line:', error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to remove invoice line',
    }
  }
}
