import { Link, useSearchParams } from 'react-router'
import { Button } from '~/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card'
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '~/components/ui/pagination'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '~/components/ui/table'
import { UploadDropzone } from '~/features/accounts/components/UploadDropzone'
import { bulkUploadAccounts } from '~/features/accounts/server/actions/bulk-upload.action'
import { accountsRepository } from '~/features/accounts/server/repository'
import { useToastFromLoader } from '~/hooks/useToastFromLoader'
import { requireAuth } from '~/server/auth/session.server'
import { getFlash } from '~/server/flash.server'
import type { Route } from './+types/index'

const PAGE_SIZE = 10

export async function action({ request }: Route.ActionArgs) {
  const session = await requireAuth(request)
  const organizationId = session.session.activeOrganizationId

  if (!organizationId) {
    return { success: false, message: 'No active organization selected' }
  }

  const formData = await request.formData()
  const actionType = formData.get('_action')

  if (actionType === 'bulk-upload') {
    return bulkUploadAccounts(organizationId, formData)
  }

  return { success: false, message: 'Unknown action' }
}

export async function loader({ request }: Route.LoaderArgs) {
  const session = await requireAuth(request)

  // Get flash message and headers to clear it
  const { flash } = getFlash(request)

  const organizationId = session.session.activeOrganizationId
  if (!organizationId) {
    return {
      accounts: [],
      pagination: { page: 1, pageSize: PAGE_SIZE, total: 0, totalPages: 0 },
      noOrganization: true,
      toast: flash,
    }
  }

  const url = new URL(request.url)
  const page = Number(url.searchParams.get('page')) || 1

  const { items: accounts, ...pagination } = await accountsRepository.getPaginated(
    organizationId,
    { page, pageSize: PAGE_SIZE }
  )

  return {
    accounts,
    pagination,
    noOrganization: false,
    toast: flash,
  }
}

export default function AccountsIndex({ loaderData }: Route.ComponentProps) {
  const { accounts, pagination, noOrganization, toast } = loaderData
  const [searchParams, setSearchParams] = useSearchParams()

  // Show toast if present in loader data
  useToastFromLoader(toast)

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams)
    params.set('page', String(newPage))
    setSearchParams(params)
  }

  const getPageNumbers = () => {
    const pages: (number | 'ellipsis')[] = []
    const { page, totalPages } = pagination

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      pages.push(1)

      if (page > 3) {
        pages.push('ellipsis')
      }

      const start = Math.max(2, page - 1)
      const end = Math.min(totalPages - 1, page + 1)

      for (let i = start; i <= end; i++) {
        pages.push(i)
      }

      if (page < totalPages - 2) {
        pages.push('ellipsis')
      }

      pages.push(totalPages)
    }

    return pages
  }

  if (noOrganization) {
    return (
      <div className='p-6'>
        <div className='rounded-lg border border-dashed p-8 text-center'>
          <p className='text-muted-foreground mb-4'>
            Please select an organization to view accounts.
          </p>
          <Link to='/organization'>
            <Button>Select Organization</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className='p-6'>
      <div className='mb-6 flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-bold'>Accounts</h1>
          <p className='text-muted-foreground'>Manage your chart of accounts</p>
        </div>
        <Link to='/accounts/new'>
          <Button>Add Account</Button>
        </Link>
      </div>

      <div className='grid gap-6 lg:grid-cols-3'>
        <div className='lg:col-span-2'>
          {accounts.length === 0 && pagination.total === 0 ? (
            <div className='rounded-lg border border-dashed p-8 text-center'>
              <p className='text-muted-foreground mb-4'>
                No accounts found. Create your first account to get started.
              </p>
              <Link to='/accounts/new'>
                <Button>Create Account</Button>
              </Link>
            </div>
          ) : (
            <>
              <div className='rounded-lg border'>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Account Number</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {accounts.map((account) => (
                      <TableRow key={account.id}>
                        <TableCell className='font-mono text-sm'>
                          {account.accountNumber}
                        </TableCell>
                        <TableCell className='font-medium'>
                          {account.name}
                        </TableCell>
                        <TableCell>
                          <Link
                            to={`/accounts/${account.id}`}
                            className='text-primary text-sm font-medium hover:underline'
                          >
                            View
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className='mt-4 flex items-center justify-between'>
                  <p className='text-muted-foreground text-sm'>
                    Showing {(pagination.page - 1) * pagination.pageSize + 1} to{' '}
                    {Math.min(
                      pagination.page * pagination.pageSize,
                      pagination.total
                    )}{' '}
                    of {pagination.total} accounts
                  </p>
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() => handlePageChange(pagination.page - 1)}
                          className={
                            pagination.page <= 1
                              ? 'pointer-events-none opacity-50'
                              : 'cursor-pointer'
                          }
                        />
                      </PaginationItem>

                      {getPageNumbers().map((pageNum, idx) =>
                        pageNum === 'ellipsis' ? (
                          <PaginationItem key={`ellipsis-${idx}`}>
                            <PaginationEllipsis />
                          </PaginationItem>
                        ) : (
                          <PaginationItem key={pageNum}>
                            <PaginationLink
                              onClick={() => handlePageChange(pageNum)}
                              isActive={pageNum === pagination.page}
                              className='cursor-pointer'
                            >
                              {pageNum}
                            </PaginationLink>
                          </PaginationItem>
                        )
                      )}

                      <PaginationItem>
                        <PaginationNext
                          onClick={() => handlePageChange(pagination.page + 1)}
                          className={
                            pagination.page >= pagination.totalPages
                              ? 'pointer-events-none opacity-50'
                              : 'cursor-pointer'
                          }
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </>
          )}
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Bulk Import</CardTitle>
              <CardDescription>
                Upload a CSV or Excel file to import multiple accounts at once
              </CardDescription>
            </CardHeader>
            <CardContent>
              <UploadDropzone />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
