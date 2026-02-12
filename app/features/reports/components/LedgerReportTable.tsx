import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '~/components/ui/table'
import type { LedgerReportLineItem, LedgerGrandTotals } from '~/features/invoice/server/ledger-report.repository'
import { PlayIcon } from 'lucide-react'

interface LedgerReportTableProps {
  data: LedgerReportLineItem[]
  grandTotals: LedgerGrandTotals
  totalDocuments: number
  reportType: 'sales-ledger' | 'purchase-ledger'
  hasRunReport: boolean
}

function fmt(amount: number) {
  return new Intl.NumberFormat('es-GT', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function LedgerReportTable({
  data,
  grandTotals,
  totalDocuments,
  hasRunReport,
}: LedgerReportTableProps) {
  if (data.length === 0) {
    return (
      <Table>
        <TableBody>
          <TableRow>
            <TableCell colSpan={17} className='h-32 text-center'>
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
                      No records match the selected filters. Try adjusting the date range.
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
      <Table className='text-xs'>
        <TableHeader>
          {/* Row 1: Grouped headers */}
          <TableRow>
            <TableHead rowSpan={2} className='text-primary text-xs font-semibold'>Fecha</TableHead>
            <TableHead rowSpan={2} className='text-primary text-xs font-semibold'>Tipo Doc.</TableHead>
            <TableHead rowSpan={2} className='text-primary text-xs font-semibold'>T</TableHead>
            <TableHead rowSpan={2} className='text-primary text-xs font-semibold'>Serie</TableHead>
            <TableHead rowSpan={2} className='text-primary text-xs font-semibold'>No. Docto.</TableHead>
            <TableHead rowSpan={2} className='text-primary text-xs font-semibold'>NIT</TableHead>
            <TableHead rowSpan={2} className='text-primary max-w-[180px] text-xs font-semibold'>Nombre</TableHead>
            <TableHead colSpan={4} className='text-primary text-center text-xs font-semibold'>Local</TableHead>
            <TableHead colSpan={4} className='text-primary text-center text-xs font-semibold'>Importacion</TableHead>
            <TableHead rowSpan={2} className='text-primary text-right text-xs font-semibold'>IVA</TableHead>
            <TableHead rowSpan={2} className='text-primary text-right text-xs font-semibold'>Total</TableHead>
          </TableRow>
          {/* Row 2: Sub-headers */}
          <TableRow>
            <TableHead className='text-primary text-right text-xs font-semibold'>Grav. Bienes</TableHead>
            <TableHead className='text-primary text-right text-xs font-semibold'>Grav. Serv.</TableHead>
            <TableHead className='text-primary text-right text-xs font-semibold'>Ex. Bienes</TableHead>
            <TableHead className='text-primary text-right text-xs font-semibold'>Ex. Serv.</TableHead>
            <TableHead className='text-primary text-right text-xs font-semibold'>Grav. Bienes</TableHead>
            <TableHead className='text-primary text-right text-xs font-semibold'>Grav. Serv.</TableHead>
            <TableHead className='text-primary text-right text-xs font-semibold'>Ex. Bienes</TableHead>
            <TableHead className='text-primary text-right text-xs font-semibold'>Ex. Serv.</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row) => (
            <TableRow key={row.id}>
              <TableCell className='whitespace-nowrap font-medium'>{row.fecha}</TableCell>
              <TableCell className='whitespace-normal break-words'>{row.tipoDoc}</TableCell>
              <TableCell>{row.tipoTran}</TableCell>
              <TableCell className='whitespace-normal break-words'>{row.serie}</TableCell>
              <TableCell className='whitespace-normal break-words font-mono'>{row.noDocto}</TableCell>
              <TableCell className='whitespace-normal break-words'>{row.nit}</TableCell>
              <TableCell className='max-w-[180px] whitespace-normal break-words'>
                {row.nombre}
              </TableCell>
              <TableCell className='text-right'>{row.localGravadosBienes ? fmt(row.localGravadosBienes) : ''}</TableCell>
              <TableCell className='text-right'>{row.localGravadosServicios ? fmt(row.localGravadosServicios) : ''}</TableCell>
              <TableCell className='text-right'>{row.localExentosBienes ? fmt(row.localExentosBienes) : ''}</TableCell>
              <TableCell className='text-right'>{row.localExentosServicios ? fmt(row.localExentosServicios) : ''}</TableCell>
              <TableCell className='text-right'>{row.importGravadosBienes ? fmt(row.importGravadosBienes) : ''}</TableCell>
              <TableCell className='text-right'>{row.importGravadosServicios ? fmt(row.importGravadosServicios) : ''}</TableCell>
              <TableCell className='text-right'>{row.importExentosBienes ? fmt(row.importExentosBienes) : ''}</TableCell>
              <TableCell className='text-right'>{row.importExentosServicios ? fmt(row.importExentosServicios) : ''}</TableCell>
              <TableCell className='text-right'>{row.ivaAmount ? fmt(row.ivaAmount) : ''}</TableCell>
              <TableCell className='text-right font-medium'>{fmt(row.totalDocumento)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell colSpan={7} className='text-right font-semibold'>
              TOTALES ({totalDocuments} documentos)
            </TableCell>
            <TableCell className='text-right font-bold text-teal-600'>{fmt(grandTotals.localGravadosBienes)}</TableCell>
            <TableCell className='text-right font-bold text-teal-600'>{fmt(grandTotals.localGravadosServicios)}</TableCell>
            <TableCell className='text-right font-bold text-teal-600'>{fmt(grandTotals.localExentosBienes)}</TableCell>
            <TableCell className='text-right font-bold text-teal-600'>{fmt(grandTotals.localExentosServicios)}</TableCell>
            <TableCell className='text-right font-bold text-teal-600'>{fmt(grandTotals.importGravadosBienes)}</TableCell>
            <TableCell className='text-right font-bold text-teal-600'>{fmt(grandTotals.importGravadosServicios)}</TableCell>
            <TableCell className='text-right font-bold text-teal-600'>{fmt(grandTotals.importExentosBienes)}</TableCell>
            <TableCell className='text-right font-bold text-teal-600'>{fmt(grandTotals.importExentosServicios)}</TableCell>
            <TableCell className='text-right font-bold text-teal-600'>{fmt(grandTotals.ivaAmount)}</TableCell>
            <TableCell className='text-right font-bold text-teal-600'>{fmt(grandTotals.totalDocumento)}</TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </div>
  )
}
