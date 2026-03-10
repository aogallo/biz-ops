import { invoiceRepository } from '../repository'
import type { CreateDraftInvoiceInput } from '../../schemas'
import type { Invoice } from '~/server/db/schemas/invoice'

export interface CreateDraftInvoiceResult {
  success: boolean
  invoice?: Invoice
  error?: string
}

// Helper to format date to YYYY-MM-DD string for Drizzle date type
function formatDateToString(date: Date): string {
  return date.toISOString().split('T')[0]
}

export async function createDraftInvoiceAction(
  input: CreateDraftInvoiceInput
): Promise<CreateDraftInvoiceResult> {
  try {
    // Create draft invoice with placeholder number
    const invoice = await invoiceRepository.create({
      organizationId: input.organizationId,
      companyId: input.companyId,
      businessPartnerId: input.businessPartnerId,
      accountingAccountId: input.accountingAccountId,
      sucursalId: input.sucursalId,
      type: input.type,
      invoiceDate: formatDateToString(input.invoiceDate),
      dueDate: input.dueDate ? formatDateToString(input.dueDate) : null,
      number: 'DRAFT', // Placeholder, will be assigned on post
      status: 'draft',
      source: 'manual',
      subtotal: '0',
      ivaAmount: '0',
      total: '0',
      currency: 'GTQ',
    })

    return {
      success: true,
      invoice,
    }
  } catch (error) {
    console.error('Error creating draft invoice:', error)
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to create draft invoice',
    }
  }
}
