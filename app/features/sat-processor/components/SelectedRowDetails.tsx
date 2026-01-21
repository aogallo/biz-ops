import { useFetcher } from 'react-router'
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
        <h3 className="mb-4 mt-6 text-sm font-bold uppercase tracking-wider text-muted-foreground">
          Selected Row Details
        </h3>
        <div className="rounded-lg border bg-muted p-4 text-center text-sm text-muted-foreground">
          Select a row to view details
        </div>
      </div>
    )
  }

  return (
    <div>
      <h3 className="mb-4 mt-6 text-sm font-bold uppercase tracking-wider text-muted-foreground">
        Selected Row Details
      </h3>
      <div className="space-y-3 rounded-lg border bg-muted p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Document Type</span>
          <span className="rounded bg-secondary px-2 py-0.5 text-xs font-bold">
            {selectedRow.dteType}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Serie/Document</span>
          <span className="text-sm font-medium">
            {selectedRow.serie}-{selectedRow.dteNumber}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Total</span>
          <span className="text-sm font-medium">
            Q {selectedRow.total.toFixed(2)}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">IVA</span>
          <span className="text-sm font-medium">
            Q {selectedRow.iva.toFixed(2)}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Currency</span>
          <span className="text-sm font-medium">{selectedRow.money}</span>
        </div>
        {selectedRow.emitterNit && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">NIT Emisor</span>
            <span className="text-sm font-medium">{selectedRow.emitterNit}</span>
          </div>
        )}
        {selectedRow.emitterName && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Nombre Emisor</span>
            <span className="max-w-[150px] truncate text-sm font-medium">
              {selectedRow.emitterName}
            </span>
          </div>
        )}
      </div>
      <div className="mt-4 border-t pt-4">
        <span className="mb-2 block text-sm text-muted-foreground">
          Accounting Account
        </span>
        <Select
          value={selectedRow.accountingAccountId ?? 'none'}
          onValueChange={handleAccountChange}
          disabled={isUpdating}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select an account" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Accounts</SelectLabel>
              <SelectItem value="none">No account assigned</SelectItem>
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
          <p className="mt-2 text-xs text-muted-foreground">Updating...</p>
        )}
      </div>
    </div>
  )
}
