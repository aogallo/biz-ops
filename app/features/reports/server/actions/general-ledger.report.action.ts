import { generalLedgerRepository } from '../repository/general-ledger.repository'
import type { GenerateReportInput, ExportReportInput } from '../../schemas'
import type {
  GeneralLedgerRow,
  GeneralLedgerGrandTotals,
  GenerateGeneralLedgerResult,
  ExportGeneralLedgerResult,
  PDFGeneralLedgerReportData,
} from '../../lib/general-ledger-types'
import { generateGeneralLedgerPDF } from '../../lib/general-ledger-pdf-generator'
import { formatDate, SPANISH_MONTHS, parseEntryNumber } from '../../lib/pdf-types'
import type { RawTransactionLine } from '../repository/general-ledger.repository'

function parseDate(dateStr: string | undefined): Date | undefined {
  if (!dateStr) return undefined
  const date = new Date(dateStr)
  return isNaN(date.getTime()) ? undefined : date
}

/**
 * Determine the hierarchy level of an account from its account_number.
 * Convention: segments separated by "-" where trailing "00"/"000" means parent.
 * e.g. "1-0-00-00-000" = level 0, "1-1-00-00-000" = level 1, "1-1-01-00-000" = level 2
 */
function getAccountLevel(accountNumber: string): number {
  const segments = accountNumber.split('-')
  // Find the last non-zero segment to determine depth
  let level = 0
  for (let i = 1; i < segments.length; i++) {
    if (segments[i] !== '0' && segments[i] !== '00' && segments[i] !== '000') {
      level = i
    }
  }
  return level
}

/**
 * Check if an account is a parent of another based on account numbers.
 */
function isParentOf(parentNumber: string, childNumber: string): boolean {
  if (parentNumber === childNumber) return false
  const parentSegments = parentNumber.split('-')
  const childSegments = childNumber.split('-')
  if (parentSegments.length !== childSegments.length) return false

  // Parent must match child on all non-zero segments
  for (let i = 0; i < parentSegments.length; i++) {
    const pSeg = parentSegments[i]
    const isZero = pSeg === '0' || pSeg === '00' || pSeg === '000'
    if (isZero) continue
    if (pSeg !== childSegments[i]) return false
  }
  return true
}

/**
 * Build the flat row array for the general ledger report.
 */
function buildGeneralLedgerRows(
  accounts: { id: string; accountNumber: string | null; name: string | null }[],
  transactionsByAccount: Map<string, RawTransactionLine[]>,
  openingBalances: Map<string, { totalDebit: number; totalCredit: number }>
): { rows: GeneralLedgerRow[]; grandTotals: GeneralLedgerGrandTotals } {
  const rows: GeneralLedgerRow[] = []

  // Build account totals map for parent aggregation
  const accountTotals = new Map<
    string,
    { openingBalance: number; totalDebit: number; totalCredit: number; closingBalance: number }
  >()

  // Filter to accounts that have either transactions or opening balances
  const activeAccountIds = new Set<string>()
  for (const account of accounts) {
    if (transactionsByAccount.has(account.id) || openingBalances.has(account.id)) {
      activeAccountIds.add(account.id)
    }
  }

  // First pass: calculate totals for leaf accounts (accounts with transactions)
  for (const account of accounts) {
    if (!activeAccountIds.has(account.id)) continue

    const opening = openingBalances.get(account.id)
    const openingBalance = opening ? opening.totalDebit - opening.totalCredit : 0

    const transactions = transactionsByAccount.get(account.id) ?? []
    let totalDebit = 0
    let totalCredit = 0
    for (const tx of transactions) {
      totalDebit += Number(tx.debitAmount)
      totalCredit += Number(tx.creditAmount)
    }

    const closingBalance = openingBalance + totalDebit - totalCredit

    accountTotals.set(account.id, {
      openingBalance,
      totalDebit,
      totalCredit,
      closingBalance,
    })
  }

  // Identify parent accounts and aggregate children's totals
  for (const parentAccount of accounts) {
    const parentNumber = parentAccount.accountNumber
    if (!parentNumber) continue

    // Only aggregate if this is a parent-type account (has zero segments)
    const segments = parentNumber.split('-')
    const hasZeroTrailing = segments.some(
      (s, i) => i > 0 && (s === '0' || s === '00' || s === '000')
    )
    if (!hasZeroTrailing) continue

    let aggregatedOpening = 0
    let aggregatedDebit = 0
    let aggregatedCredit = 0

    for (const childAccount of accounts) {
      if (!childAccount.accountNumber) continue
      if (childAccount.id === parentAccount.id) continue
      if (!isParentOf(parentNumber, childAccount.accountNumber)) continue

      const childTotals = accountTotals.get(childAccount.id)
      if (childTotals) {
        aggregatedOpening += childTotals.openingBalance
        aggregatedDebit += childTotals.totalDebit
        aggregatedCredit += childTotals.totalCredit
      }
    }

    // Only add parent if it has children with data
    if (aggregatedDebit !== 0 || aggregatedCredit !== 0 || aggregatedOpening !== 0) {
      // Add own transactions too
      const ownTotals = accountTotals.get(parentAccount.id)
      if (ownTotals) {
        aggregatedOpening += ownTotals.openingBalance
        aggregatedDebit += ownTotals.totalDebit
        aggregatedCredit += ownTotals.totalCredit
      }

      accountTotals.set(parentAccount.id, {
        openingBalance: aggregatedOpening,
        totalDebit: aggregatedDebit,
        totalCredit: aggregatedCredit,
        closingBalance: aggregatedOpening + aggregatedDebit - aggregatedCredit,
      })
      activeAccountIds.add(parentAccount.id)
    }
  }

  // Second pass: build flat rows in account_number order
  let grandTotalDebit = 0
  let grandTotalCredit = 0
  let grandTotalOpening = 0
  let grandTotalClosing = 0

  for (const account of accounts) {
    if (!activeAccountIds.has(account.id)) continue
    const accountNumber = account.accountNumber ?? ''
    const accountName = account.name ?? ''
    const level = getAccountLevel(accountNumber)
    const totals = accountTotals.get(account.id)!

    // Account header
    rows.push({
      rowType: 'account-header',
      accountId: account.id,
      accountNumber,
      accountName,
      openingBalance: totals.openingBalance,
      level,
    })

    // Transaction rows (only for accounts that have direct transactions)
    const transactions = transactionsByAccount.get(account.id) ?? []
    if (transactions.length > 0) {
      let runningBalance = totals.openingBalance
      for (const tx of transactions) {
        const debit = Number(tx.debitAmount)
        const credit = Number(tx.creditAmount)
        runningBalance += debit - credit

        const parsed = parseEntryNumber(tx.entryNumber)

        rows.push({
          rowType: 'transaction',
          entryId: tx.entryId,
          entryType: parsed.type,
          entryNumber: parsed.number,
          entryDate: formatDate(tx.entryDate),
          description: tx.lineDescription || tx.entryDescription,
          debit,
          credit,
          runningBalance,
        })
      }
    }

    // Account total row
    rows.push({
      rowType: 'account-total',
      accountNumber,
      accountName,
      totalDebit: totals.totalDebit,
      totalCredit: totals.totalCredit,
      closingBalance: totals.closingBalance,
    })

    // Only count leaf-level accounts in grand totals (avoid double counting)
    const isLeaf = !accounts.some(
      (other) =>
        other.id !== account.id &&
        other.accountNumber &&
        isParentOf(accountNumber, other.accountNumber) &&
        activeAccountIds.has(other.id)
    )
    if (isLeaf) {
      grandTotalDebit += totals.totalDebit
      grandTotalCredit += totals.totalCredit
      grandTotalOpening += totals.openingBalance
      grandTotalClosing += totals.closingBalance
    }
  }

  return {
    rows,
    grandTotals: {
      totalDebit: grandTotalDebit,
      totalCredit: grandTotalCredit,
      totalOpeningBalance: grandTotalOpening,
      totalClosingBalance: grandTotalClosing,
    },
  }
}

// ── Public API ────────────────────────────────────────────────────

export async function generateGeneralLedgerAction(
  organizationId: string,
  input: Omit<GenerateReportInput, '_action'>
): Promise<GenerateGeneralLedgerResult> {
  const { companyId, dateFrom, dateTo, page, pageSize } = input
  const parsedDateFrom = parseDate(dateFrom) ?? new Date(new Date().getFullYear(), 0, 1)
  const parsedDateTo = parseDate(dateTo) ?? new Date()

  const [accounts, transactionLines, openingBalances] = await Promise.all([
    generalLedgerRepository.getAccountsByOrganization(organizationId),
    generalLedgerRepository.getPostedLinesByDateRange(organizationId, {
      companyId,
      dateFrom: parsedDateFrom,
      dateTo: parsedDateTo,
    }),
    generalLedgerRepository.getOpeningBalances(organizationId, {
      companyId,
      dateBefore: parsedDateFrom,
    }),
  ])

  // Group transactions by account ID
  const transactionsByAccount = new Map<string, RawTransactionLine[]>()
  for (const line of transactionLines) {
    const existing = transactionsByAccount.get(line.accountId) ?? []
    existing.push(line)
    transactionsByAccount.set(line.accountId, existing)
  }

  const { rows, grandTotals } = buildGeneralLedgerRows(
    accounts,
    transactionsByAccount,
    openingBalances
  )

  // Paginate by top-level account groups (header + transactions + total)
  const accountGroups: { startIdx: number; endIdx: number }[] = []
  let i = 0
  while (i < rows.length) {
    if (rows[i].rowType === 'account-header') {
      const start = i
      i++
      while (i < rows.length && rows[i].rowType !== 'account-header') {
        i++
      }
      accountGroups.push({ startIdx: start, endIdx: i })
    } else {
      i++
    }
  }

  const totalGroups = accountGroups.length
  const totalPages = Math.max(1, Math.ceil(totalGroups / pageSize))
  const startGroup = (page - 1) * pageSize
  const endGroup = Math.min(startGroup + pageSize, totalGroups)

  const paginatedRows: GeneralLedgerRow[] = []
  for (let g = startGroup; g < endGroup; g++) {
    const group = accountGroups[g]
    for (let r = group.startIdx; r < group.endIdx; r++) {
      paginatedRows.push(rows[r])
    }
  }

  // Build report month string
  const month = parsedDateFrom.getMonth()
  const year = parsedDateFrom.getFullYear()
  const reportMonth = `${SPANISH_MONTHS[month]} ${year}`

  return {
    success: true,
    data: paginatedRows,
    grandTotals,
    reportMonth,
    total: totalGroups,
    page,
    pageSize,
    totalPages,
  }
}

export async function exportGeneralLedgerAction(
  organizationId: string,
  input: Omit<ExportReportInput, '_action'>
): Promise<ExportGeneralLedgerResult> {
  const { companyId, dateFrom, dateTo } = input
  const parsedDateFrom = parseDate(dateFrom) ?? new Date(new Date().getFullYear(), 0, 1)
  const parsedDateTo = parseDate(dateTo) ?? new Date()

  const [accounts, transactionLines, openingBalances] = await Promise.all([
    generalLedgerRepository.getAccountsByOrganization(organizationId),
    generalLedgerRepository.getPostedLinesByDateRange(organizationId, {
      companyId,
      dateFrom: parsedDateFrom,
      dateTo: parsedDateTo,
    }),
    generalLedgerRepository.getOpeningBalances(organizationId, {
      companyId,
      dateBefore: parsedDateFrom,
    }),
  ])

  // Group transactions by account ID
  const transactionsByAccount = new Map<string, RawTransactionLine[]>()
  for (const line of transactionLines) {
    const existing = transactionsByAccount.get(line.accountId) ?? []
    existing.push(line)
    transactionsByAccount.set(line.accountId, existing)
  }

  const { rows, grandTotals } = buildGeneralLedgerRows(
    accounts,
    transactionsByAccount,
    openingBalances
  )

  // Get company name
  let companyName = 'Empresa'
  if (companyId) {
    companyName =
      (await generalLedgerRepository.getCompanyName(companyId)) ?? 'Empresa'
  }

  const dateFromStr = formatDate(parsedDateFrom)
  const dateToStr = formatDate(parsedDateTo)

  const pdfData: PDFGeneralLedgerReportData = {
    companyName,
    reportTitle: 'LIBRO MAYOR',
    dateFrom: dateFromStr,
    dateTo: dateToStr,
    rows,
    grandTotals,
  }

  const pdfBytes = await generateGeneralLedgerPDF(pdfData)
  const pdfBase64 = btoa(String.fromCharCode(...pdfBytes))

  const fromStr = dateFrom
    ? new Date(dateFrom).toISOString().split('T')[0]
    : 'all'
  const toStr = dateTo ? new Date(dateTo).toISOString().split('T')[0] : 'all'
  const filename = `libro-mayor-${fromStr}-to-${toStr}.pdf`

  return {
    success: true,
    export: {
      pdfBase64,
      filename,
    },
  }
}
