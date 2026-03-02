import { posRepository } from '../repository'
import { organizationConfigRepository } from '~/features/organization-config/server/repository'
import { createJournalEntryAction } from '~/features/journal-entry/server/actions/create.action'

export interface CreatePosJournalEntryResult {
  success: boolean
  journalEntryId?: string
  skipped?: boolean
  error?: string
}

export async function createPosSessionJournalEntry(
  sessionId: string,
  organizationId: string,
  companyId: string | null | undefined
): Promise<CreatePosJournalEntryResult> {
  if (!companyId) {
    return { success: true, skipped: true }
  }

  try {
    // Get Z-Report for the session
    const zReport = await posRepository.getZReportBySessionId(sessionId)
    if (!zReport) {
      return { success: false, error: 'Z-Report not found for session' }
    }

    // Get org accounting config
    const config =
      await organizationConfigRepository.getByOrganizationId(organizationId)
    if (!config) {
      return { success: true, skipped: true }
    }

    // Check that at least the revenue account and IVA account are configured
    const { defaultSalesAccountId, ivaDebitoFiscalAccountId } = config
    if (!defaultSalesAccountId || !ivaDebitoFiscalAccountId) {
      return { success: true, skipped: true }
    }

    const totalCashSales = Number(zReport.totalCashSales ?? 0)
    const totalCardSales = Number(zReport.totalCardSales ?? 0)
    const totalCheckSales = Number(zReport.totalCheckSales ?? 0)
    const totalSales = Number(zReport.totalSales ?? 0)
    const totalTax = Number(zReport.totalTax ?? 0)

    // No sales — skip
    if (totalSales === 0) {
      return { success: true, skipped: true }
    }

    // Build debit lines (only if amount > 0 AND account configured)
    const lines: Array<{
      accountingAccountId: string
      description: string
      debitAmount: number
      creditAmount: number
    }> = []

    if (totalCashSales > 0 && config.posCashAccountId) {
      lines.push({
        accountingAccountId: config.posCashAccountId,
        description: 'POS Cash Sales',
        debitAmount: totalCashSales,
        creditAmount: 0,
      })
    }

    if (totalCardSales > 0 && config.posCardAccountId) {
      lines.push({
        accountingAccountId: config.posCardAccountId,
        description: 'POS Card Sales',
        debitAmount: totalCardSales,
        creditAmount: 0,
      })
    }

    if (totalCheckSales > 0 && config.posCheckAccountId) {
      lines.push({
        accountingAccountId: config.posCheckAccountId,
        description: 'POS Check Sales',
        debitAmount: totalCheckSales,
        creditAmount: 0,
      })
    }

    // If no debit lines (no payment accounts configured for the methods used), skip
    if (lines.length === 0) {
      return { success: true, skipped: true }
    }

    // Credit lines
    const totalDebits = lines.reduce((sum, l) => sum + l.debitAmount, 0)
    const revenueAmount = totalDebits - totalTax

    if (revenueAmount > 0) {
      lines.push({
        accountingAccountId: defaultSalesAccountId,
        description: 'POS Revenue',
        debitAmount: 0,
        creditAmount: revenueAmount,
      })
    }

    if (totalTax > 0) {
      lines.push({
        accountingAccountId: ivaDebitoFiscalAccountId,
        description: 'POS IVA Débito Fiscal',
        debitAmount: 0,
        creditAmount: totalTax,
      })
    }

    // Create journal entry
    const result = await createJournalEntryAction({
      organizationId,
      companyId,
      description: `POS Session Close - ${zReport.terminalName} - ${zReport.cashierName}`,
      entryDate: zReport.closedAt,
      source: 'pos',
      sourcePosSessionId: sessionId,
      status: 'draft',
      lines: lines.map((line, index) => ({
        lineNumber: index + 1,
        ...line,
      })),
    })

    if (!result.success) {
      return { success: false, error: result.error }
    }

    return { success: true, journalEntryId: result.journalEntry?.id }
  } catch (error) {
    console.error('Error creating POS journal entry:', error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to create POS journal entry',
    }
  }
}
