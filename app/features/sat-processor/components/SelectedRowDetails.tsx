import { CheckCircle2, ExternalLink, Loader2 } from 'lucide-react'
import { useEffect } from 'react'
import { Link, useFetcher } from 'react-router'
import { toast } from 'sonner'
import { Badge } from '~/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'
import type { SatFile } from '~/server/db/schemas/sat-file'
import type { AccountingAccount } from '~/server/db/schemas/accounting'

interface SelectedRowDetailsProps {
  selectedRow: SatFile | null
  accounts: AccountingAccount[]
}

export function SelectedRowDetails({
  selectedRow,
  accounts,
}: SelectedRowDetailsProps) {
  const fetcher = useFetcher()
  const isUpdating = fetcher.state !== 'idle'

  // Handle fetcher response for toast notifications
  const fetcherData = fetcher.data as
    | { success?: boolean; error?: string; message?: string }
    | undefined

  useEffect(() => {
    if (fetcherData?.error) {
      toast.error(fetcherData.error)
    }
    if (fetcherData?.success && fetcherData?.message) {
      toast.success(fetcherData.message)
    }
  }, [fetcherData])

  const handleAccountChange = (accountId: string) => {
    if (!selectedRow) return

    fetcher.submit(
      {
        _action: 'updateAccount',
        satFileId: selectedRow.id,
        accountingAccountId: accountId === 'none' ? '' : accountId,
      },
      { method: 'post' }
    )
  }

  if (!selectedRow) {
    return (
      <div>
        <h3 className='mb-4 mt-6 text-sm font-bold uppercase tracking-wider text-muted-foreground'>
          Selected Row Details
        </h3>
        <div className='rounded-lg border bg-muted p-4 text-center text-sm text-muted-foreground'>
          Select a row to view details
        </div>
      </div>
    )
  }

  const isProcessed = !!selectedRow.journalEntryId

  return (
    <div>
      <h3 className='mb-4 mt-6 text-sm font-bold uppercase tracking-wider text-muted-foreground'>
        Selected Row Details
      </h3>
      <div className='space-y-3 rounded-lg border bg-muted p-4'>
        {/* Processing Status */}
        <div className='flex items-center justify-between'>
          <span className='text-sm text-muted-foreground'>Status</span>
          {isProcessed ? (
            <Badge variant='default' className='bg-green-600'>
              <CheckCircle2 className='mr-1 h-3 w-3' />
              Processed
            </Badge>
          ) : selectedRow.accountingAccountId ? (
            <Badge variant='secondary'>Pending Processing</Badge>
          ) : (
            <Badge variant='outline'>No Account</Badge>
          )}
        </div>

        <div className='flex items-center justify-between'>
          <span className='text-sm text-muted-foreground'>Document Type</span>
          <span className='rounded bg-secondary px-2 py-0.5 text-xs font-bold'>
            {selectedRow.dteType}
          </span>
        </div>
        <div className='flex items-center justify-between'>
          <span className='text-sm text-muted-foreground'>Serie/Document</span>
          <span className='text-sm font-medium'>
            {selectedRow.serie}-{selectedRow.dteNumber}
          </span>
        </div>
        <div className='flex items-center justify-between'>
          <span className='text-sm text-muted-foreground'>Total</span>
          <span className='text-sm font-medium'>
            Q {selectedRow.total.toFixed(2)}
          </span>
        </div>
        <div className='flex items-center justify-between'>
          <span className='text-sm text-muted-foreground'>IVA</span>
          <span className='text-sm font-medium'>
            Q {selectedRow.iva.toFixed(2)}
          </span>
        </div>
        <div className='flex items-center justify-between'>
          <span className='text-sm text-muted-foreground'>Currency</span>
          <span className='text-sm font-medium'>{selectedRow.money}</span>
        </div>
        {selectedRow.emitterNit && (
          <div className='flex items-center justify-between'>
            <span className='text-sm text-muted-foreground'>NIT Emisor</span>
            <span className='text-sm font-medium'>{selectedRow.emitterNit}</span>
          </div>
        )}
        {selectedRow.emitterName && (
          <div className='flex items-center justify-between'>
            <span className='text-sm text-muted-foreground'>Nombre Emisor</span>
            <span className='max-w-[150px] truncate text-sm font-medium'>
              {selectedRow.emitterName}
            </span>
          </div>
        )}
        {selectedRow.receptorNit && (
          <div className='flex items-center justify-between'>
            <span className='text-sm text-muted-foreground'>NIT Receptor</span>
            <span className='text-sm font-medium'>
              {selectedRow.receptorNit}
            </span>
          </div>
        )}
        {selectedRow.receptorName && (
          <div className='flex items-center justify-between'>
            <span className='text-sm text-muted-foreground'>Nombre Receptor</span>
            <span className='max-w-[150px] truncate text-sm font-medium'>
              {selectedRow.receptorName}
            </span>
          </div>
        )}
      </div>

      {/* Journal Entry Link */}
      {isProcessed && selectedRow.journalEntryId && (
        <div className='mt-4 rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-900 dark:bg-green-950/30'>
          <div className='flex items-center justify-between'>
            <span className='text-sm font-medium text-green-700 dark:text-green-400'>
              Journal Entry Created
            </span>
            <Link
              to={`/journal-entries/${selectedRow.journalEntryId}`}
              className='flex items-center gap-1 text-sm text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300'
            >
              View Entry
              <ExternalLink className='h-3 w-3' />
            </Link>
          </div>
        </div>
      )}

      {/* Accounting Account Selection */}
      <div className='mt-4 border-t pt-4'>
        <span className='mb-2 block text-sm text-muted-foreground'>
          Accounting Account
        </span>
        <Select
          value={selectedRow.accountingAccountId ?? 'none'}
          onValueChange={handleAccountChange}
          disabled={isUpdating}
        >
          <SelectTrigger className='w-full'>
            <SelectValue placeholder='Select an account' />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Accounts</SelectLabel>
              <SelectItem value='none'>No account assigned</SelectItem>
              {accounts.map((account) => (
                <SelectItem key={account.id} value={account.id}>
                  {account.accountNumber ? `${account.accountNumber} - ` : ''}
                  {account.name}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        {isUpdating && (
          <div className='mt-2 flex items-center gap-2 text-xs text-muted-foreground'>
            <Loader2 className='h-3 w-3 animate-spin' />
            {isProcessed ? 'Updating journal entry...' : 'Creating journal entry...'}
          </div>
        )}

        {/* Help text */}
        {!isProcessed && !selectedRow.accountingAccountId && (
          <p className='mt-2 text-xs text-muted-foreground'>
            Select an accounting account to automatically create a journal entry
            for this record.
          </p>
        )}
        {!isProcessed && selectedRow.accountingAccountId && (
          <p className='mt-2 text-xs text-amber-600 dark:text-amber-400'>
            Processing pending. The journal entry will be created once the
            configuration is complete.
          </p>
        )}
      </div>
    </div>
  )
}
