import { invoiceRepository } from '../repository'
import { organizationConfigRepository } from '~/features/organization-config/server/repository'
import { createJournalEntryAction } from '~/features/journal-entry/server/actions/create.action'
import type { Invoice } from '~/server/db/schemas/invoice'
import type { JournalEntry } from '~/server/db/schemas/journalEntry'

export interface PostInvoiceResult {
  success: boolean
  invoice?: Invoice
  journalEntry?: JournalEntry
  error?: string
}

export async function postInvoiceAction(
  invoiceId: string
): Promise<PostInvoiceResult> {
  try {
    // Get the invoice with details
    const invoice = await invoiceRepository.getByIdWithDetails(invoiceId)

    if (!invoice) {
      return {
        success: false,
        error: 'Invoice not found',
      }
    }

    if (invoice.status !== 'draft') {
      return {
        success: false,
        error: 'Only draft invoices can be posted',
      }
    }

    // Validate invoice has lines
    if (!invoice.lines || invoice.lines.length === 0) {
      return {
        success: false,
        error: 'Invoice must have at least one line to be posted',
      }
    }

    // Validate totals are correct
    const calculatedTotal = invoice.lines.reduce(
      (sum, line) => sum + Number(line.total),
      0
    )

    // Allow small rounding differences
    const tolerance = 0.01
    if (Math.abs(Number(invoice.total) - calculatedTotal) > tolerance) {
      return {
        success: false,
        error: 'Invoice totals do not match line totals',
      }
    }

    // Get organization config for invoice numbering and default accounts
    const config = await organizationConfigRepository.getByOrganizationId(
      invoice.organizationId
    )

    if (!config) {
      return {
        success: false,
        error: 'Organization accounting config not found',
      }
    }

    // Validate required accounts are configured
    if (invoice.type === 'sale') {
      if (!config.accountsReceivableAccountId) {
        return {
          success: false,
          error: 'Accounts Receivable account not configured',
        }
      }
      if (!config.ivaDebitoFiscalAccountId) {
        return {
          success: false,
          error: 'IVA Débito Fiscal account not configured',
        }
      }
    } else {
      // purchase
      if (!config.accountsPayableAccountId) {
        return {
          success: false,
          error: 'Accounts Payable account not configured',
        }
      }
      if (!config.ivaCreditoFiscalAccountId) {
        return {
          success: false,
          error: 'IVA Crédito Fiscal account not configured',
        }
      }
    }

    // Get next invoice number
    const { formatted: invoiceNumber } =
      await organizationConfigRepository.getNextManualInvoiceNumber(
        invoice.organizationId
      )

    // Update invoice with number and status
    const updatedInvoice = await invoiceRepository.update(invoiceId, {
      number: invoiceNumber,
      status: 'posted',
    })

    if (!updatedInvoice) {
      return {
        success: false,
        error: 'Failed to update invoice status',
      }
    }

    // Create journal entry
    const journalEntryLines = buildJournalEntryLines(invoice, config)

    // Convert invoice date string to Date for journal entry
    const entryDate = new Date(invoice.invoiceDate)

    const journalEntryResult = await createJournalEntryAction({
      organizationId: invoice.organizationId,
      companyId: invoice.companyId,
      entryDate,
      description: `${invoice.type === 'sale' ? 'Venta' : 'Compra'} - ${invoice.businessPartner?.name || 'Unknown'} - ${invoiceNumber}`,
      notes: null,
      source: 'invoice',
      sourceInvoiceId: invoiceId,
      status: 'draft',
      lines: journalEntryLines,
    })

    if (!journalEntryResult.success) {
      // Rollback invoice status
      await invoiceRepository.update(invoiceId, {
        number: 'DRAFT',
        status: 'draft',
      })

      return {
        success: false,
        error: journalEntryResult.error || 'Failed to create journal entry',
      }
    }

    return {
      success: true,
      invoice: updatedInvoice,
      journalEntry: journalEntryResult.journalEntry,
    }
  } catch (error) {
    console.error('Error posting invoice:', error)
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to post invoice',
    }
  }
}

/**
 * Build journal entry lines based on invoice type
 *
 * SALE invoice:
 * Dr  Accounts Receivable     [Total]
 *     Cr  Revenue Account     [Subtotal per line]
 *     Cr  IVA Débito Fiscal   [Total IVA]
 *
 * PURCHASE invoice:
 * Dr  Expense Account         [Subtotal per line]
 * Dr  IVA Crédito Fiscal      [Total IVA]
 *     Cr  Accounts Payable    [Total]
 */
function buildJournalEntryLines(
  invoice: NonNullable<Awaited<ReturnType<typeof invoiceRepository.getByIdWithDetails>>>,
  config: NonNullable<Awaited<ReturnType<typeof organizationConfigRepository.getByOrganizationId>>>
): Array<{
  lineNumber: number
  accountingAccountId: string
  description: string | null
  debitAmount: number
  creditAmount: number
  invoiceLineId?: string
}> {
  const lines: Array<{
    lineNumber: number
    accountingAccountId: string
    description: string | null
    debitAmount: number
    creditAmount: number
    invoiceLineId?: string
  }> = []

  let lineNumber = 1

  if (invoice.type === 'sale') {
    // Debit: Accounts Receivable for total
    lines.push({
      lineNumber: lineNumber++,
      accountingAccountId: config.accountsReceivableAccountId!,
      description: `Cuenta por cobrar - ${invoice.businessPartner?.name}`,
      debitAmount: Number(invoice.total),
      creditAmount: 0,
    })

    // Credit: Revenue accounts for each line subtotal
    for (const line of invoice.lines) {
      lines.push({
        lineNumber: lineNumber++,
        accountingAccountId: line.accountingAccountId,
        description: line.description,
        debitAmount: 0,
        creditAmount: Number(line.subtotal),
        invoiceLineId: line.id,
      })
    }

    // Credit: IVA Débito Fiscal for total IVA (if any)
    const totalIva = Number(invoice.ivaAmount)
    if (totalIva > 0) {
      lines.push({
        lineNumber: lineNumber++,
        accountingAccountId: config.ivaDebitoFiscalAccountId!,
        description: 'IVA Débito Fiscal',
        debitAmount: 0,
        creditAmount: totalIva,
      })
    }
  } else {
    // purchase
    // Debit: Expense accounts for each line subtotal
    for (const line of invoice.lines) {
      lines.push({
        lineNumber: lineNumber++,
        accountingAccountId: line.accountingAccountId,
        description: line.description,
        debitAmount: Number(line.subtotal),
        creditAmount: 0,
        invoiceLineId: line.id,
      })
    }

    // Debit: IVA Crédito Fiscal for total IVA (if any)
    const totalIva = Number(invoice.ivaAmount)
    if (totalIva > 0) {
      lines.push({
        lineNumber: lineNumber++,
        accountingAccountId: config.ivaCreditoFiscalAccountId!,
        description: 'IVA Crédito Fiscal',
        debitAmount: totalIva,
        creditAmount: 0,
      })
    }

    // Credit: Accounts Payable for total
    lines.push({
      lineNumber: lineNumber++,
      accountingAccountId: config.accountsPayableAccountId!,
      description: `Cuenta por pagar - ${invoice.businessPartner?.name}`,
      debitAmount: 0,
      creditAmount: Number(invoice.total),
    })
  }

  return lines
}
