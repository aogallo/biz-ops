import { CheckCircle2, ExternalLink, Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useFetcher } from 'react-router'
import { toast } from 'sonner'
import { Badge } from '~/components/ui/badge'
import { Combobox } from '~/components/ui/combobox'
import { Label } from '~/components/ui/label'
import { RadioGroup, RadioGroupItem } from '~/components/ui/radio-group'
import type { AccountingAccount } from '~/server/db/schemas/accounting'
import type { SatFile } from '~/server/db/schemas/sat-file'

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
  const [itemType, setItemType] = useState<'goods' | 'services' | null>(
    selectedRow?.itemType as 'goods' | 'services' | null ?? null
  )
  const [selectedAccountId, setSelectedAccountId] = useState<string>(
    selectedRow?.accountingAccountId ?? 'none'
  )

  // Sync state when selectedRow changes
  useEffect(() => {
    setItemType(selectedRow?.itemType as 'goods' | 'services' | null ?? null)
    setSelectedAccountId(selectedRow?.accountingAccountId ?? 'none')
  }, [selectedRow?.id])

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

    if (!itemType) {
      toast.error('Seleccioná el Tipo de Operación (Bien o Servicio) antes de asignar una cuenta.')
      return
    }

    setSelectedAccountId(accountId)
    fetcher.submit(
      {
        _action: 'updateAccount',
        satFileId: selectedRow.id,
        accountingAccountId: accountId === 'none' ? '' : accountId,
        itemType: itemType,
      },
      { method: 'post' }
    )
  }

  const handleItemTypeChange = (value: string) => {
    const newType = value as 'goods' | 'services'
    setItemType(newType)

    if (!selectedRow || !selectedRow.accountingAccountId) return

    // Submit immediately if account already assigned
    fetcher.submit(
      {
        _action: 'updateAccount',
        satFileId: selectedRow.id,
        accountingAccountId: selectedRow.accountingAccountId,
        itemType: newType,
      },
      { method: 'post' }
    )
  }

  if (!selectedRow) {
    return (
      <div>
        <h3 className='text-muted-foreground mt-6 mb-4 text-sm font-bold tracking-wider uppercase'>
          Selected Row Details
        </h3>
        <div className='bg-muted text-muted-foreground rounded-lg border p-4 text-center text-sm'>
          Select a row to view details
        </div>
      </div>
    )
  }

  const isProcessed = !!selectedRow.journalEntryId

  return (
    <div>
      <h3 className='text-muted-foreground mt-6 mb-4 text-sm font-bold tracking-wider uppercase'>
        Selected Row Details
      </h3>
      <div className='bg-muted space-y-3 rounded-lg border p-4'>
        {/* Processing Status */}
        <div className='flex items-center justify-between'>
          <span className='text-muted-foreground text-sm'>Status</span>
          {isProcessed ? (
            <Badge variant='default' className='bg-green-600'>
              <CheckCircle2 className='mr-1 h-3 w-3' />
              Processed
            </Badge>
          ) : selectedAccountId !== 'none' ? (
            <Badge variant='secondary'>Pending Processing</Badge>
          ) : (
            <Badge variant='outline'>No Account</Badge>
          )}
        </div>

        <div className='flex items-center justify-between'>
          <span className='text-muted-foreground text-sm'>Document Type</span>
          <span className='bg-secondary rounded px-2 py-0.5 text-xs font-bold'>
            {selectedRow.dteType}
          </span>
        </div>
        <div className='flex items-center justify-between'>
          <span className='text-muted-foreground text-sm'>Serie</span>
          <span className='text-sm font-medium'>{selectedRow.serie}</span>
        </div>
        <div className='flex items-center justify-between'>
          <span className='text-muted-foreground text-sm'>Document</span>
          <span className='text-sm font-medium'>{selectedRow.dteNumber}</span>
        </div>
        <div className='flex items-center justify-between'>
          <span className='text-muted-foreground text-sm'>Total</span>
          <span className='text-sm font-medium'>
            Q {selectedRow.total.toFixed(2)}
          </span>
        </div>
        <div className='flex items-center justify-between'>
          <span className='text-muted-foreground text-sm'>IVA</span>
          <span className='text-sm font-medium'>
            Q {selectedRow.iva.toFixed(2)}
          </span>
        </div>
        <div className='flex items-center justify-between'>
          <span className='text-muted-foreground text-sm'>Currency</span>
          <span className='text-sm font-medium'>{selectedRow.money}</span>
        </div>
        {selectedRow.emitterNit && (
          <div className='flex items-center justify-between'>
            <span className='text-muted-foreground text-sm'>NIT Emisor</span>
            <span className='text-sm font-medium'>
              {selectedRow.emitterNit}
            </span>
          </div>
        )}
        {selectedRow.emitterName && (
          <div className='flex items-center justify-between'>
            <span className='text-muted-foreground text-sm'>Nombre Emisor</span>
            <span className='max-w-[150px] truncate text-sm font-medium'>
              {selectedRow.emitterName}
            </span>
          </div>
        )}
        {selectedRow.receptorNit && (
          <div className='flex items-center justify-between'>
            <span className='text-muted-foreground text-sm'>NIT Receptor</span>
            <span className='text-sm font-medium'>
              {selectedRow.receptorNit}
            </span>
          </div>
        )}
        {selectedRow.receptorName && (
          <div className='flex items-center justify-between'>
            <span className='text-muted-foreground text-sm'>
              Nombre Receptor
            </span>
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

      {/* Item Type Selection */}
      <div className='mt-4 border-t pt-4'>
        <span className='text-muted-foreground mb-2 block text-sm'>
          Tipo de Operación
        </span>
        <RadioGroup
          value={itemType ?? ''}
          onValueChange={handleItemTypeChange}
          className='flex gap-4'
          disabled={isUpdating}
        >
          <div className='flex items-center gap-2'>
            <RadioGroupItem value='goods' id='goods' />
            <Label htmlFor='goods'>Bien</Label>
          </div>
          <div className='flex items-center gap-2'>
            <RadioGroupItem value='services' id='services' />
            <Label htmlFor='services'>Servicio</Label>
          </div>
        </RadioGroup>
      </div>

      {/* Accounting Account Selection */}
      <div className='mt-4 border-t pt-4'>
        <span className='text-muted-foreground mb-2 block text-sm'>
          Accounting Account
        </span>
        <Combobox
          value={selectedAccountId}
          onValueChange={handleAccountChange}
          disabled={isUpdating}
          options={[
            { value: 'none', label: 'No account assigned' },
            ...accounts.map((account) => ({
              value: account.id,
              label: account.accountNumber
                ? `${account.accountNumber} - ${account.name}`
                : account.name || '',
            })),
          ]}
          placeholder='Select an account'
          searchPlaceholder='Search accounts...'
          emptyMessage='No accounts found.'
        />
        {isUpdating && (
          <div className='text-muted-foreground mt-2 flex items-center gap-2 text-xs'>
            <Loader2 className='h-3 w-3 animate-spin' />
            {isProcessed
              ? 'Updating journal entry...'
              : 'Creating journal entry...'}
          </div>
        )}

        {/* Help text */}
        {!isProcessed && selectedAccountId === 'none' && (
          <p className='text-muted-foreground mt-2 text-xs'>
            Select an accounting account to automatically create a journal entry
            for this record.
          </p>
        )}
        {!isProcessed && selectedAccountId !== 'none' && (
          <p className='mt-2 text-xs text-amber-600 dark:text-amber-400'>
            Processing pending. The journal entry will be created once the
            configuration is complete.
          </p>
        )}
      </div>
    </div>
  )
}
