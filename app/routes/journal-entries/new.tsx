import { redirect } from 'react-router'
import { accountsRepository } from '~/features/accounts/server/repository'
import { companyRepository } from '~/features/company/server/repository/company.repository'
import {
  JournalEntryForm,
  type AccountOption,
  type CompanyOption,
} from '~/features/journal-entry/components/JournalEntryForm'
import { createJournalEntrySchema } from '~/features/journal-entry/schemas'
import { createJournalEntryAction } from '~/features/journal-entry/server/actions/create.action'
import { journalEntryRepository } from '~/features/journal-entry/server/repository'
import { requireAuth } from '~/server/auth/session.server'
import type { Route } from './+types/new'

export async function loader({ request }: Route.LoaderArgs) {
  const session = await requireAuth(request)
  const organizationId = session.session.activeOrganizationId

  if (!organizationId) {
    return redirect('/journal-entries')
  }

  const [companies, accounts, recentAccounts] = await Promise.all([
    companyRepository.getByOrganization(organizationId),
    accountsRepository.getAllByOrganization(organizationId),
    journalEntryRepository.getRecentAccounts(organizationId, 10),
  ])

  return {
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

export async function action({ request }: Route.ActionArgs) {
  const session = await requireAuth(request)
  const organizationId = session.session.activeOrganizationId

  if (!organizationId) {
    return { error: 'No organization selected' }
  }

  const formData = await request.formData()

  // Parse form data
  const companyId = formData.get('companyId') as string
  const entryDateStr = formData.get('entryDate') as string
  const description = formData.get('description') as string
  const notes = formData.get('notes') as string
  const linesJson = formData.get('lines') as string

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

  // Build input for validation
  const input = {
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
  const result = createJournalEntrySchema.safeParse(input)

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

  // Create journal entry
  const createResult = await createJournalEntryAction(result.data)

  if (!createResult.success) {
    return { error: createResult.error }
  }

  return redirect(`/journal-entries/${createResult.journalEntry?.id}`)
}

export default function NewJournalEntryPage({
  loaderData,
  actionData,
}: Route.ComponentProps) {
  const { companies, accounts, recentAccounts } = loaderData

  return (
    <JournalEntryForm
      mode='create'
      companies={companies}
      accounts={accounts}
      recentAccounts={recentAccounts}
      actionData={actionData}
    />
  )
}
