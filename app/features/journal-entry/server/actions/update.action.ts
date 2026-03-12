import { journalEntryRepository } from '../repository'
import type { JournalEntry } from '~/server/db/schemas/journalEntry'

export interface UpdateJournalEntryInput {
  id: string
  organizationId: string
  companyId: string
  entryDate: Date
  description: string
  notes: string | null
  lines: Array<{
    lineNumber: number
    accountingAccountId: string
    description: string | null
    debitAmount: number
    creditAmount: number
  }>
}

export interface UpdateJournalEntryResult {
  success: boolean
  journalEntry?: JournalEntry
  error?: string
}

export async function updateJournalEntryAction(
  input: UpdateJournalEntryInput
): Promise<UpdateJournalEntryResult> {
  try {
    // Get existing entry
    const existingEntry = await journalEntryRepository.getById(input.id)

    if (!existingEntry) {
      return {
        success: false,
        error: 'Journal entry not found',
      }
    }

    // Verify entry belongs to organization
    if (existingEntry.organizationId !== input.organizationId) {
      return {
        success: false,
        error: 'Unauthorized',
      }
    }

    // Only draft entries can be edited
    if (existingEntry.status !== 'draft') {
      return {
        success: false,
        error: 'Only draft entries can be edited',
      }
    }

    // Update entry header
    const updatedEntry = await journalEntryRepository.update(input.id, {
      companyId: input.companyId,
      entryDate: input.entryDate,
      description: input.description,
      notes: input.notes,
    })

    if (!updatedEntry) {
      return {
        success: false,
        error: 'Failed to update journal entry',
      }
    }

    // Update lines (delete existing and insert new)
    await journalEntryRepository.updateLines(
      input.id,
      input.lines.map((line) => ({
        lineNumber: line.lineNumber,
        accountingAccountId: line.accountingAccountId,
        description: line.description,
        debitAmount: String(line.debitAmount),
        creditAmount: String(line.creditAmount),
      }))
    )

    // Fetch updated entry with lines
    const finalEntry = await journalEntryRepository.getById(input.id)

    return {
      success: true,
      journalEntry: finalEntry || updatedEntry,
    }
  } catch (error) {
    console.error('Error updating journal entry:', error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to update journal entry',
    }
  }
}
