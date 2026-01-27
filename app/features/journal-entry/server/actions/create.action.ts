import { journalEntryRepository } from '../repository'
import { organizationConfigRepository } from '~/features/organization-config/server/repository'
import type { CreateJournalEntryInput } from '../../schemas'
import type { JournalEntry } from '~/server/db/schemas/journalEntry'

export interface CreateJournalEntryResult {
  success: boolean
  journalEntry?: JournalEntry
  error?: string
}

export async function createJournalEntryAction(
  input: CreateJournalEntryInput
): Promise<CreateJournalEntryResult> {
  try {
    // Get next entry number
    const { formatted: entryNumber } =
      await organizationConfigRepository.getNextJournalEntryNumber(
        input.organizationId
      )

    // Create journal entry with lines
    const journalEntry = await journalEntryRepository.create(
      {
        organizationId: input.organizationId,
        companyId: input.companyId,
        entryNumber,
        description: input.description,
        entryDate: input.entryDate,
        notes: input.notes,
        source: input.source || 'manual',
        sourceInvoiceId: input.sourceInvoiceId,
        sourceSatFileId: input.sourceSatFileId,
        status: 'draft',
      },
      input.lines.map((line, index) => ({
        lineNumber: line.lineNumber ?? index + 1,
        accountingAccountId: line.accountingAccountId,
        description: line.description,
        debitAmount: String(line.debitAmount),
        creditAmount: String(line.creditAmount),
        invoiceLineId: line.invoiceLineId,
      }))
    )

    return {
      success: true,
      journalEntry,
    }
  } catch (error) {
    console.error('Error creating journal entry:', error)
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to create journal entry',
    }
  }
}
