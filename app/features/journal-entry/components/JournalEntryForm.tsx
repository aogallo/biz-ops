import { format } from 'date-fns'
import { CalendarIcon, Plus, Trash2 } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import { Form, Link, useNavigation } from 'react-router'
import { Button } from '~/components/ui/button'
import { Calendar } from '~/components/ui/calendar'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card'
import { Combobox, type ComboboxOption } from '~/components/ui/combobox'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '~/components/ui/popover'
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '~/components/ui/table'
import { Textarea } from '~/components/ui/textarea'
import { cn } from '~/lib/utils'

export interface JournalEntryLineFormData {
  id: string
  accountId: string
  description: string
  debitAmount: string
  creditAmount: string
}

export interface JournalEntryFormData {
  companyId: string
  entryDate: Date | undefined
  description: string
  notes: string
  lines: JournalEntryLineFormData[]
}

export interface AccountOption {
  id: string
  accountNumber: string | null
  name: string | null
}

export interface CompanyOption {
  id: string
  name: string
}

export interface JournalEntryFormProps {
  mode: 'create' | 'edit'
  companies: CompanyOption[]
  accounts: AccountOption[]
  recentAccounts?: AccountOption[]
  initialData?: JournalEntryFormData
  entryId?: string
  actionData?: {
    error?: string
    fieldErrors?: Record<string, string[] | undefined>
  }
}

function generateLineId(): string {
  return `line-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

function createEmptyLine(): JournalEntryLineFormData {
  return {
    id: generateLineId(),
    accountId: '',
    description: '',
    debitAmount: '',
    creditAmount: '',
  }
}

export function JournalEntryForm({
  mode,
  companies,
  accounts,
  recentAccounts = [],
  initialData,
  entryId,
  actionData,
}: JournalEntryFormProps) {
  const navigation = useNavigation()
  const isSubmitting = navigation.state === 'submitting'

  // Form state
  const [companyId, setCompanyId] = useState(initialData?.companyId ?? '')
  const [entryDate, setEntryDate] = useState<Date | undefined>(
    initialData?.entryDate ?? new Date()
  )
  const [description, setDescription] = useState(initialData?.description ?? '')
  const [notes, setNotes] = useState(initialData?.notes ?? '')
  const [lines, setLines] = useState<JournalEntryLineFormData[]>(
    initialData?.lines ?? [createEmptyLine(), createEmptyLine()]
  )

  // Build account options with recent accounts first
  const accountOptions = useMemo<ComboboxOption[]>(() => {
    const recentIds = new Set(recentAccounts.map((a) => a.id))
    const recentOptions: ComboboxOption[] = recentAccounts.map((account) => ({
      value: account.id,
      label: `${account.accountNumber ?? ''} ${account.name ?? ''}`.trim(),
      description: 'Recently used',
    }))

    const otherOptions: ComboboxOption[] = accounts
      .filter((account) => !recentIds.has(account.id))
      .map((account) => ({
        value: account.id,
        label: `${account.accountNumber ?? ''} ${account.name ?? ''}`.trim(),
      }))

    return [...recentOptions, ...otherOptions]
  }, [accounts, recentAccounts])

  // Company options
  const companyOptions = useMemo<ComboboxOption[]>(
    () =>
      companies.map((company) => ({
        value: company.id,
        label: company.name,
      })),
    [companies]
  )

  // Calculate totals
  const totals = useMemo(() => {
    const totalDebit = lines.reduce(
      (sum, line) => sum + (parseFloat(line.debitAmount) || 0),
      0
    )
    const totalCredit = lines.reduce(
      (sum, line) => sum + (parseFloat(line.creditAmount) || 0),
      0
    )
    const difference = Math.abs(totalDebit - totalCredit)
    const isBalanced = difference < 0.01
    return { totalDebit, totalCredit, difference, isBalanced }
  }, [lines])

  // Line handlers
  const addLine = useCallback(() => {
    setLines((prev) => [...prev, createEmptyLine()])
  }, [])

  const removeLine = useCallback((lineId: string) => {
    setLines((prev) => {
      if (prev.length <= 2) return prev
      return prev.filter((line) => line.id !== lineId)
    })
  }, [])

  const updateLine = useCallback(
    (lineId: string, field: keyof JournalEntryLineFormData, value: string) => {
      setLines((prev) =>
        prev.map((line) => {
          if (line.id !== lineId) return line

          // If setting debit, clear credit and vice versa
          if (field === 'debitAmount' && value) {
            return { ...line, debitAmount: value, creditAmount: '' }
          }
          if (field === 'creditAmount' && value) {
            return { ...line, creditAmount: value, debitAmount: '' }
          }

          return { ...line, [field]: value }
        })
      )
    },
    []
  )

  // Validate form before submission
  const isFormValid = useMemo(() => {
    if (!companyId || !entryDate || !description.trim()) return false
    if (lines.length < 2) return false
    if (!totals.isBalanced) return false

    // Check each line has account and either debit or credit
    for (const line of lines) {
      if (!line.accountId) return false
      const hasDebit = parseFloat(line.debitAmount) > 0
      const hasCredit = parseFloat(line.creditAmount) > 0
      if (!hasDebit && !hasCredit) return false
    }

    return true
  }, [companyId, entryDate, description, lines, totals.isBalanced])

  return (
    <div className="container mx-auto py-6">
      {/* Error display */}
      {actionData?.error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400">
          {actionData.error}
        </div>
      )}

      <Form method="post">
        {/* Hidden fields for form data */}
        <input type="hidden" name="companyId" value={companyId} />
        <input
          type="hidden"
          name="entryDate"
          value={entryDate ? entryDate.toISOString() : ''}
        />
        <input type="hidden" name="description" value={description} />
        <input type="hidden" name="notes" value={notes} />
        <input type="hidden" name="lines" value={JSON.stringify(lines)} />
        {entryId && <input type="hidden" name="entryId" value={entryId} />}

        {/* Header Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>
              {mode === 'create' ? 'New Journal Entry' : 'Edit Journal Entry'}
            </CardTitle>
            <CardDescription>
              {mode === 'create'
                ? 'Create a new manual journal entry'
                : 'Edit this draft journal entry'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              {/* Company */}
              <div className="space-y-2">
                <Label htmlFor="company">Company *</Label>
                <Combobox
                  options={companyOptions}
                  value={companyId}
                  onValueChange={setCompanyId}
                  placeholder="Select company..."
                  searchPlaceholder="Search companies..."
                  emptyMessage="No companies found."
                />
                {actionData?.fieldErrors?.companyId && (
                  <p className="text-destructive text-xs">
                    {actionData.fieldErrors.companyId[0]}
                  </p>
                )}
              </div>

              {/* Entry Date */}
              <div className="space-y-2">
                <Label htmlFor="entryDate">Entry Date *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal',
                        !entryDate && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {entryDate ? format(entryDate, 'PPP') : 'Select date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={entryDate}
                      onSelect={setEntryDate}
                    />
                  </PopoverContent>
                </Popover>
                {actionData?.fieldErrors?.entryDate && (
                  <p className="text-destructive text-xs">
                    {actionData.fieldErrors.entryDate[0]}
                  </p>
                )}
              </div>

              {/* Description */}
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="description">Description *</Label>
                <Input
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter entry description"
                />
                {actionData?.fieldErrors?.description && (
                  <p className="text-destructive text-xs">
                    {actionData.fieldErrors.description[0]}
                  </p>
                )}
              </div>

              {/* Notes */}
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Optional notes for this entry"
                  rows={3}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lines Card */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Journal Entry Lines</CardTitle>
              <Button type="button" variant="outline" size="sm" onClick={addLine}>
                <Plus className="mr-2 h-4 w-4" />
                Add Line
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[60px]">#</TableHead>
                    <TableHead className="min-w-[200px]">Account *</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="w-[150px] text-right">Debit</TableHead>
                    <TableHead className="w-[150px] text-right">Credit</TableHead>
                    <TableHead className="w-[60px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lines.map((line, index) => (
                    <TableRow key={line.id}>
                      <TableCell className="text-muted-foreground">
                        {index + 1}
                      </TableCell>
                      <TableCell>
                        <Combobox
                          options={accountOptions}
                          value={line.accountId}
                          onValueChange={(value) =>
                            updateLine(line.id, 'accountId', value)
                          }
                          placeholder="Select account..."
                          searchPlaceholder="Search accounts..."
                          emptyMessage="No accounts found."
                          size="sm"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={line.description}
                          onChange={(e) =>
                            updateLine(line.id, 'description', e.target.value)
                          }
                          placeholder="Line description"
                          className="h-8"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={line.debitAmount}
                          onChange={(e) =>
                            updateLine(line.id, 'debitAmount', e.target.value)
                          }
                          placeholder="0.00"
                          className="h-8 text-right font-mono"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={line.creditAmount}
                          onChange={(e) =>
                            updateLine(line.id, 'creditAmount', e.target.value)
                          }
                          placeholder="0.00"
                          className="h-8 text-right font-mono"
                        />
                      </TableCell>
                      <TableCell>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeLine(line.id)}
                          disabled={lines.length <= 2}
                          className="h-8 w-8"
                        >
                          <Trash2 className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell colSpan={3} className="text-right font-semibold">
                      Totals
                    </TableCell>
                    <TableCell className="text-right font-mono font-semibold">
                      Q {totals.totalDebit.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right font-mono font-semibold">
                      Q {totals.totalCredit.toFixed(2)}
                    </TableCell>
                    <TableCell />
                  </TableRow>
                </TableFooter>
              </Table>
            </div>

            {/* Balance indicator */}
            <div className="mt-4">
              {totals.isBalanced ? (
                <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700 dark:border-green-900 dark:bg-green-950/30 dark:text-green-400">
                  Entry is balanced
                </div>
              ) : (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400">
                  Entry is not balanced. Difference: Q {totals.difference.toFixed(2)}
                </div>
              )}
            </div>

            {actionData?.fieldErrors?.lines && (
              <p className="mt-2 text-destructive text-xs">
                {actionData.fieldErrors.lines[0]}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex items-center justify-end gap-4">
          <Button type="button" variant="outline" asChild>
            <Link to="/journal-entries">Cancel</Link>
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || !isFormValid}
            className="min-w-[120px]"
          >
            {isSubmitting
              ? 'Saving...'
              : mode === 'create'
                ? 'Save as Draft'
                : 'Save Changes'}
          </Button>
        </div>
      </Form>
    </div>
  )
}
