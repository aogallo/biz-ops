export const ACCOUNT_MESSAGES = {
  notFound: 'Account not found. It may have been deleted.',
  deleted: 'Account deleted successfully.',
  created: 'Account created successfully.',
  updated: 'Account updated successfully.',
  noOrganization: 'Please select an organization to view accounts.',
  duplicateAccountNumber: 'An account with this account number already exists.',
  bulkUploadSuccess: (inserted: number, updated: number) =>
    `Bulk upload completed: ${inserted} inserted, ${updated} updated.`,
  bulkUploadError: 'Failed to process bulk upload.',
  invalidFile: 'Invalid file format. Please use CSV or Excel (.xls, .xlsx).',
  noValidRows: 'No valid rows found in the file.',
} as const
