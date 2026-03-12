import type { Table } from '@tanstack/react-table'
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react'
import { useTranslation } from '~/i18n/context'
import { Button } from '../ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select'

interface DataTablePaginationProps<TData> {
  table: Table<TData>
}

export function DataTablePagination<TData>({
  table,
}: DataTablePaginationProps<TData>) {
  const { t } = useTranslation()
  const pageIndex = table.getState().pagination.pageIndex
  const pageCount = table.getPageCount()
  const pageSize = table.getState().pagination.pageSize
  const totalRows = table.getFilteredRowModel().rows.length
  const selectedRows = table.getFilteredSelectedRowModel().rows.length

  return (
    <div className='mt-4 flex flex-col gap-4 px-2 sm:flex-row sm:items-center sm:justify-between'>
      {/* Left side - Row info */}
      <div className='flex flex-col gap-1 text-sm sm:flex-row sm:items-center sm:gap-4'>
        {selectedRows > 0 && (
          <span className='text-muted-foreground'>
            {t('common.rowsSelected', {
              selected: String(selectedRows),
              total: String(totalRows),
            })}
          </span>
        )}
        <span className='text-muted-foreground'>
          {t('common.totalRows', { total: String(totalRows) })}
        </span>
      </div>

      {/* Right side - Pagination controls */}
      <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6'>
        {/* Rows per page selector */}
        <div className='flex items-center gap-2'>
          <span className='text-muted-foreground text-sm whitespace-nowrap'>
            {t('common.rowsPerPage')}
          </span>
          <Select
            value={String(pageSize)}
            onValueChange={(value) => table.setPageSize(Number(value))}
          >
            <SelectTrigger className='h-8 w-[70px]'>
              <SelectValue placeholder={pageSize} />
            </SelectTrigger>
            <SelectContent side='top'>
              {[10, 20, 30, 40, 50].map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Page indicator */}
        <span className='text-sm font-medium whitespace-nowrap'>
          {t('common.pageOf', {
            page: String(pageIndex + 1),
            total: String(pageCount || 1),
          })}
        </span>

        {/* Navigation buttons */}
        <div className='flex items-center gap-1'>
          <Button
            variant='outline'
            size='icon'
            className='size-8'
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
          >
            <span className='sr-only'>{t('common.goToFirstPage')}</span>
            <ChevronsLeft className='size-4' />
          </Button>
          <Button
            variant='outline'
            size='icon'
            className='size-8'
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <span className='sr-only'>{t('common.goToPreviousPage')}</span>
            <ChevronLeft className='size-4' />
          </Button>
          <Button
            variant='outline'
            size='icon'
            className='size-8'
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            <span className='sr-only'>{t('common.goToNextPage')}</span>
            <ChevronRight className='size-4' />
          </Button>
          <Button
            variant='outline'
            size='icon'
            className='size-8'
            onClick={() => table.setPageIndex(pageCount - 1)}
            disabled={!table.getCanNextPage()}
          >
            <span className='sr-only'>{t('common.goToLastPage')}</span>
            <ChevronsRight className='size-4' />
          </Button>
        </div>
      </div>
    </div>
  )
}
