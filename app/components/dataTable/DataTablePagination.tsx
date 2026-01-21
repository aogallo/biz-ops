import type { Table } from '@tanstack/react-table'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '../ui/button'
import { Pagination, PaginationContent, PaginationItem } from '../ui/pagination'

interface DataTablePaginationProps<TData> {
  table: Table<TData>
}

export function DataTablePagination<TData>({
  table,
}: DataTablePaginationProps<TData>) {
  return (
    <div className='flex items-center justify-between px-2'>
      <div className='flex basis-1/3 flex-row gap-4'>
        <p className='text-muted-foreground'>
          {table.getFilteredSelectedRowModel().rows.length} of{' '}
          {table.getFilteredRowModel().rows.length} row(s) selected.
        </p>
        <p className='text-sm font-medium'>
          Page {table.getState().pagination.pageIndex + 1} of{' '}
          {table.getPageCount()}
        </p>
      </div>
      <Pagination className=''>
        <PaginationContent>
          <PaginationItem>
            <Button
              variant='outline'
              size='icon'
              className='size-8'
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <span className='sr-only'>Previous</span>
              <ChevronLeft />
            </Button>
          </PaginationItem>
          <PaginationItem>
            <Button
              variant='outline'
              size='icon'
              className='size-8'
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <span className='sr-only'>Go to next page</span>
              <ChevronRight />
            </Button>
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  )
}
