import { journalEntryRepository } from '../repository'
import type { JournalEntry } from '~/server/db/schemas/journalEntry'

export interface VoidJournalEntryResult {
  success: boolean
  journalEntry?: JournalEntry
  error?: string
}

export async function voidJournalEntryAction(
  journalEntryId: string,
  reason: string,
  organizationId: string
): Promise<VoidJournalEntryResult> {
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
        error: 'Unauthorized to void this journal entry',
      }
    }

    // Check if entry is posted (only posted entries can be voided)
    if (entry.status !== 'posted') {
      return {
        success: false,
        error: `Cannot void journal entry with status: ${entry.status}. Only posted entries can be voided.`,
      }
    }

    // Void the entry (append reason to notes)
    const existingNotes = entry.notes || ''
    const voidNote = `[VOIDED: ${reason}]`
    const updatedNotes = existingNotes
      ? `${existingNotes}\n${voidNote}`
      : voidNote

    // First update the status
    const updated = await journalEntryRepository.updateStatus(
      journalEntryId,
      'voided'
    )

    if (!updated) {
      return {
        success: false,
        error: 'Failed to void journal entry',
      }
    }

    return {
      success: true,
      journalEntry: updated,
    }
  } catch (error) {
    console.error('Error voiding journal entry:', error)
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to void journal entry',
    }
  }
}
