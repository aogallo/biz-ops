import { z } from 'zod'
import {
  insertJournalEntrySchema,
  insertJournalEntryLineSchema,
  selectJournalEntrySchema,
  selectJournalEntryLineSchema,
} from '~/server/db/schemas/journalEntry'

// Base schemas from drizzle-zod
export {
  selectJournalEntrySchema,
  selectJournalEntryLineSchema,
}

// Schema for creating a journal entry line
export const createJournalEntryLineSchema = insertJournalEntryLineSchema
  .omit({
    id: true,
    journalEntryId: true,
    createdAt: true,
    updatedAt: true,
  })
  .extend({
    debitAmount: z.coerce.number().min(0),
    creditAmount: z.coerce.number().min(0),
  })
  .refine(
    (data) => {
      // Either debit or credit must be > 0, not both
      const hasDebit = Number(data.debitAmount) > 0
      const hasCredit = Number(data.creditAmount) > 0
      return (hasDebit || hasCredit) && !(hasDebit && hasCredit)
    },
    {
      message: 'Each line must have either a debit or credit amount, but not both',
    }
  )

// Schema for creating a journal entry with lines
export const createJournalEntrySchema = insertJournalEntrySchema
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
    postedAt: true,
    postedBy: true,
    totalDebit: true,
    totalCredit: true,
    entryNumber: true,
  })
  .extend({
    lines: z.array(createJournalEntryLineSchema).min(2, 'At least 2 lines required'),
  })
  .refine(
    (data) => {
      // Total debits must equal total credits
      const totalDebit = data.lines.reduce(
        (sum, line) => sum + Number(line.debitAmount),
        0
      )
      const totalCredit = data.lines.reduce(
        (sum, line) => sum + Number(line.creditAmount),
        0
      )
      return Math.abs(totalDebit - totalCredit) < 0.01
    },
    {
      message: 'Total debits must equal total credits',
      path: ['lines'],
    }
  )

// Schema for posting a journal entry
export const postJournalEntrySchema = z.object({
  journalEntryId: z.string().uuid(),
})

// Schema for voiding a journal entry
export const voidJournalEntrySchema = z.object({
  journalEntryId: z.string().uuid(),
  reason: z.string().min(1, 'Reason is required').max(500),
})

// Types
export type CreateJournalEntryInput = z.infer<typeof createJournalEntrySchema>
export type CreateJournalEntryLineInput = z.infer<typeof createJournalEntryLineSchema>
export type PostJournalEntryInput = z.infer<typeof postJournalEntrySchema>
export type VoidJournalEntryInput = z.infer<typeof voidJournalEntrySchema>
