import { redirect } from 'react-router'
import { accountsRepository } from '~/features/accounts/server/repository'
import { companyRepository } from '~/features/company/server/repository/company.repository'
import {
  JournalEntryForm,
  type AccountOption,
  type CompanyOption,
  type JournalEntryFormData,
  type JournalEntryLineFormData,
} from '~/features/journal-entry/components/JournalEntryForm'
import { createJournalEntrySchema } from '~/features/journal-entry/schemas'
import { updateJournalEntryAction } from '~/features/journal-entry/server/actions/update.action'
import { journalEntryRepository } from '~/features/journal-entry/server/repository'
import { requireAuth } from '~/server/auth/session.server'
import type { Route } from './+types/$id.edit'

export async function loader({ request, params }: Route.LoaderArgs) {
  const session = await requireAuth(request)
  const organizationId = session.session.activeOrganizationId

  if (!organizationId) {
    return redirect('/journal-entries')
  }

  // Fetch the entry
  const entry = await journalEntryRepository.getById(params.id)

  if (!entry) {
    throw new Response('Journal entry not found', { status: 404 })
  }

  // Verify entry belongs to organization
  if (entry.organizationId !== organizationId) {
    throw new Response('Unauthorized', { status: 403 })
  }

  // Only draft entries can be edited
  if (entry.status !== 'draft') {
    return redirect(`/journal-entries/${params.id}`)
  }

  // Fetch companies and accounts
  const [companies, accounts, recentAccounts] = await Promise.all([
    companyRepository.getByOrganization(organizationId),
    accountsRepository.getAllByOrganization(organizationId),
    journalEntryRepository.getRecentAccounts(organizationId, 10),
  ])

  // Transform entry to form data
  const initialData: JournalEntryFormData = {
    companyId: entry.companyId,
    entryDate: new Date(entry.entryDate),
    description: entry.description,
    notes: entry.notes || '',
    lines: entry.lines.map(
      (line): JournalEntryLineFormData => ({
        id: line.id,
        accountId: line.accountingAccountId,
        description: line.description || '',
        debitAmount:
          Number(line.debitAmount) > 0 ? String(line.debitAmount) : '',
        creditAmount:
          Number(line.creditAmount) > 0 ? String(line.creditAmount) : '',
      })
    ),
  }

  return {
    entryId: entry.id,
    initialData,
    companies: companies.map(
      (c): CompanyOption => ({
        id: c.id,
        name: c.name,
      })
    ),
    accounts: accounts.map(
      (a): AccountOption => ({
        id: a.id,
        accountNumber: a.accountNumber,
        name: a.name,
      })
    ),
    recentAccounts: recentAccounts.map(
      (a): AccountOption => ({
        id: a.id,
        accountNumber: a.accountNumber,
        name: a.name,
      })
    ),
  }
}

export async function action({ request, params }: Route.ActionArgs) {
  const session = await requireAuth(request)
  const organizationId = session.session.activeOrganizationId

  if (!organizationId) {
    return { error: 'No organization selected' }
  }

  const formData = await request.formData()

  // Parse form data
  const entryId = formData.get('entryId') as string
  const companyId = formData.get('companyId') as string
  const entryDateStr = formData.get('entryDate') as string
  const description = formData.get('description') as string
  const notes = formData.get('notes') as string
  const linesJson = formData.get('lines') as string

  // Verify entry ID matches
  if (entryId !== params.id) {
    return { error: 'Entry ID mismatch' }
  }

  // Parse lines from JSON
  let parsedLines: Array<{
    accountId: string
    description: string
    debitAmount: string
    creditAmount: string
  }> = []

  try {
    parsedLines = JSON.parse(linesJson)
  } catch {
    return {
      error: 'Invalid lines data',
      fieldErrors: { lines: ['Failed to parse lines data'] },
    }
  }

  // Validate that company belongs to organization
  const company = await companyRepository.getById(organizationId, companyId)
  if (!company) {
    return {
      error: 'Invalid company',
      fieldErrors: { companyId: ['Selected company not found'] },
    }
  }

  // Validate accounts belong to organization
  const accountIds = parsedLines.map((l) => l.accountId)
  const accounts = await accountsRepository.getAllByOrganization(organizationId)
  const validAccountIds = new Set(accounts.map((a) => a.id))

  for (const accountId of accountIds) {
    if (!validAccountIds.has(accountId)) {
      return {
        error: 'Invalid account',
        fieldErrors: { lines: ['One or more accounts are not valid'] },
      }
    }
  }

  // Transform lines for validation
  const transformedLines = parsedLines.map((line, index) => ({
    lineNumber: index + 1,
    accountingAccountId: line.accountId,
    description: line.description || null,
    debitAmount: parseFloat(line.debitAmount) || 0,
    creditAmount: parseFloat(line.creditAmount) || 0,
  }))

  // Build input for validation (reuse create schema for line validation)
  const validationInput = {
    organizationId,
    companyId,
    entryDate: new Date(entryDateStr),
    description,
    notes: notes || null,
    status: 'draft' as const,
    source: 'manual' as const,
    lines: transformedLines,
  }

  // Validate with Zod
  const result = createJournalEntrySchema.safeParse(validationInput)

  if (!result.success) {
    const fieldErrors: Record<string, string[]> = {}
    for (const issue of result.error.issues) {
      const path = issue.path.join('.')
      if (!fieldErrors[path]) {
        fieldErrors[path] = []
      }
      fieldErrors[path].push(issue.message)
    }

    return {
      error: 'Validation failed',
      fieldErrors,
    }
  }

  // Update journal entry
  const updateResult = await updateJournalEntryAction({
    id: entryId,
    organizationId,
    companyId,
    entryDate: new Date(entryDateStr),
    description,
    notes: notes || null,
    lines: transformedLines,
  })

  if (!updateResult.success) {
    return { error: updateResult.error }
  }

  return redirect(`/journal-entries/${entryId}`)
}

export default function EditJournalEntryPage({
  loaderData,
  actionData,
}: Route.ComponentProps) {
  const { entryId, initialData, companies, accounts, recentAccounts } =
    loaderData

  return (
    <JournalEntryForm
      mode='edit'
      companies={companies}
      accounts={accounts}
      recentAccounts={recentAccounts}
      initialData={initialData}
      entryId={entryId}
      actionData={actionData}
    />
  )
}
