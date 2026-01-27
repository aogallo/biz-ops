import { journalEntryRepository } from '../repository'
import type { JournalEntry } from '~/server/db/schemas/journalEntry'

export interface PostJournalEntryResult {
  success: boolean
  journalEntry?: JournalEntry
  error?: string
}

export async function postJournalEntryAction(
  journalEntryId: string,
  userId: string,
  organizationId: string
): Promise<PostJournalEntryResult> {
  try {
    // Get the journal entry
    const entry = await journalEntryRepository.getById(journalEntryId)

    if (!entry) {
      return {
        success: false,
        error: 'Journal entry not found',
      }
    }

    // Verify organization ownership
    if (entry.organizationId !== organizationId) {
      return {
        success: false,
        error: 'Unauthorized to post this journal entry',
      }
    }

    // Check if entry is in draft status
    if (entry.status !== 'draft') {
      return {
        success: false,
        error: `Cannot post journal entry with status: ${entry.status}`,
      }
    }

    // Verify debits equal credits
    const totalDebit = Number(entry.totalDebit)
    const totalCredit = Number(entry.totalCredit)

    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      return {
        success: false,
        error: 'Total debits must equal total credits',
      }
    }

    // Post the entry
    const updated = await journalEntryRepository.updateStatus(
      journalEntryId,
      'posted',
      userId
    )

    return {
      success: true,
      journalEntry: updated!,
    }
  } catch (error) {
    console.error('Error posting journal entry:', error)
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to post journal entry',
    }
  }
}
