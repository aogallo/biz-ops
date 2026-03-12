import { invoiceRepository } from '../repository'
import type { UpdateInvoiceInput } from '../../schemas'
import type { Invoice } from '~/server/db/schemas/invoice'

// Helper to format date to YYYY-MM-DD string for Drizzle date type
function formatDateToString(date: Date): string {
  return date.toISOString().split('T')[0]
}

export interface UpdateInvoiceResult {
  success: boolean
  invoice?: Invoice
  error?: string
}

export async function updateInvoiceAction(
  invoiceId: string,
  input: UpdateInvoiceInput
): Promise<UpdateInvoiceResult> {
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
        error: 'Only draft invoices can be updated',
      }
    }

    const updateData: Parameters<typeof invoiceRepository.update>[1] = {}

    if (input.invoiceDate !== undefined) {
      updateData.invoiceDate = formatDateToString(input.invoiceDate)
    }
    if (input.dueDate !== undefined) {
      updateData.dueDate = input.dueDate
        ? formatDateToString(input.dueDate)
        : null
    }
    if (input.businessPartnerId !== undefined) {
      updateData.businessPartnerId = input.businessPartnerId
    }
    if (input.accountingAccountId !== undefined) {
      updateData.accountingAccountId = input.accountingAccountId
    }
    if (input.serie !== undefined) {
      updateData.serie = input.serie
    }
    if (input.authorizationNumber !== undefined) {
      updateData.authorizationNumber = input.authorizationNumber
    }

    const invoice = await invoiceRepository.update(invoiceId, updateData)

    if (!invoice) {
      return {
        success: false,
        error: 'Failed to update invoice',
      }
    }

    return {
      success: true,
      invoice,
    }
  } catch (error) {
    console.error('Error updating invoice:', error)
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to update invoice',
    }
  }
}
