import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '~/components/ui/table'
import type {
  GeneralLedgerRow,
  GeneralLedgerGrandTotals,
} from '~/features/reports/lib/general-ledger-types'
import { PlayIcon } from 'lucide-react'
import { cn } from '~/lib/utils'

interface GeneralLedgerTableProps {
  data: GeneralLedgerRow[]
  grandTotals: GeneralLedgerGrandTotals
  reportMonth: string
  hasRunReport: boolean
}

function fmt(amount: number) {
  return new Intl.NumberFormat('es-GT', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function GeneralLedgerTable({
  data,
  grandTotals,
  reportMonth,
  hasRunReport,
}: GeneralLedgerTableProps) {
  if (data.length === 0) {
    return (
      <Table>
        <TableBody>
          <TableRow>
            <TableCell colSpan={9} className='h-32 text-center'>
              <div className='text-muted-foreground flex flex-col items-center gap-2'>
                {!hasRunReport ? (
                  <>
                    <PlayIcon className='size-8 opacity-50' />
                    <p>Click &quot;Generate Report&quot; to load data</p>
                  </>
                ) : (
                  <>
                    <p className='text-lg font-medium'>No data found</p>
                    <p className='text-sm'>
                      No records match the selected filters. Try adjusting the
                      date range.
                    </p>
                  </>
                )}
              </div>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    )
  }

  return (
    <div className='overflow-x-auto'>
      {reportMonth && (
        <p className='text-muted-foreground mb-2 text-center text-sm font-medium'>
          {reportMonth}
        </p>
      )}
      <Table className='text-xs'>
        <TableHeader>
          <TableRow>
            <TableHead className='text-primary text-xs font-semibold'>
              Cuenta
            </TableHead>
            <TableHead className='text-primary text-xs font-semibold'>
              Tipo
            </TableHead>
            <TableHead className='text-primary text-xs font-semibold'>
              Numero
            </TableHead>
            <TableHead className='text-primary text-xs font-semibold'>
              Fecha
            </TableHead>
            <TableHead className='text-primary max-w-[250px] text-xs font-semibold'>
              Descripcion
            </TableHead>
            <TableHead className='text-primary text-right text-xs font-semibold'>
              Saldo Inicial
            </TableHead>
            <TableHead className='text-primary text-right text-xs font-semibold'>
              Cargos
            </TableHead>
            <TableHead className='text-primary text-right text-xs font-semibold'>
              Abonos
            </TableHead>
            <TableHead className='text-primary text-right text-xs font-semibold'>
              Saldo Final
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row, idx) => {
            if (row.rowType === 'account-header') {
              return (
                <TableRow
                  key={`header-${row.accountId}`}
                  className='bg-muted/50'
                >
                  <TableCell
                    colSpan={5}
                    className={cn(
                      'font-bold',
                      row.level > 0 && `pl-${Math.min(row.level * 4, 16)}`
                    )}
                    style={
                      row.level > 0
                        ? { paddingLeft: `${row.level * 1}rem` }
                        : undefined
                    }
                  >
                    {row.accountNumber} — {row.accountName}
                  </TableCell>
                  <TableCell className='text-right font-bold'>
                    {fmt(row.openingBalance)}
                  </TableCell>
                  <TableCell />
                  <TableCell />
                  <TableCell />
                </TableRow>
              )
            }

            if (row.rowType === 'transaction') {
              return (
                <TableRow key={`tx-${row.entryId}-${idx}`}>
                  <TableCell />
                  <TableCell className='text-muted-foreground'>
                    {row.entryType}
                  </TableCell>
                  <TableCell className='text-muted-foreground font-mono'>
                    {row.entryNumber}
                  </TableCell>
                  <TableCell className='whitespace-nowrap'>
                    {row.entryDate}
                  </TableCell>
                  <TableCell className='max-w-[250px] truncate'>
                    {row.description}
                  </TableCell>
                  <TableCell />
                  <TableCell className='text-right'>
                    {row.debit ? fmt(row.debit) : ''}
                  </TableCell>
                  <TableCell className='text-right'>
                    {row.credit ? fmt(row.credit) : ''}
                  </TableCell>
                  <TableCell className='text-right'>
                    {fmt(row.runningBalance)}
                  </TableCell>
                </TableRow>
              )
            }

            if (row.rowType === 'account-total') {
              return (
                <TableRow
                  key={`total-${row.accountNumber}-${idx}`}
                  className='border-t-2'
                >
                  <TableCell colSpan={5} className='text-right font-bold'>
                    Total: {row.accountNumber}
                  </TableCell>
                  <TableCell />
                  <TableCell className='text-right font-bold text-teal-600'>
                    {fmt(row.totalDebit)}
                  </TableCell>
                  <TableCell className='text-right font-bold text-teal-600'>
                    {fmt(row.totalCredit)}
                  </TableCell>
                  <TableCell className='text-right font-bold text-teal-600'>
                    {fmt(row.closingBalance)}
                  </TableCell>
                </TableRow>
              )
            }

            return null
          })}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell colSpan={5} className='text-right font-semibold'>
              GRAN TOTAL
            </TableCell>
            <TableCell className='text-right font-bold text-teal-600'>
              {fmt(grandTotals.totalOpeningBalance)}
            </TableCell>
            <TableCell className='text-right font-bold text-teal-600'>
              {fmt(grandTotals.totalDebit)}
            </TableCell>
            <TableCell className='text-right font-bold text-teal-600'>
              {fmt(grandTotals.totalCredit)}
            </TableCell>
            <TableCell className='text-right font-bold text-teal-600'>
              {fmt(grandTotals.totalClosingBalance)}
            </TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </div>
  )
}
