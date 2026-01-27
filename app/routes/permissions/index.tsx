import { Link, useSearchParams } from 'react-router'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
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
import { useToastFromLoader } from '~/hooks/useToastFromLoader'
import { requireAuth } from '~/server/auth/session.server'
import { getFlash } from '~/server/flash.server'
import { permissionsRepository } from '../../features/permissions/server/repository'
import type { Route } from './+types/index'

const PAGE_SIZE = 10

export async function loader({ request }: Route.LoaderArgs) {
  const session = await requireAuth(request)
  const { flash } = getFlash(request)

  const url = new URL(request.url)
  const page = Number(url.searchParams.get('page')) || 1

  const { items: permissions, total, totalPages } =
    await permissionsRepository.getPaginated({ page, pageSize: PAGE_SIZE })

  return {
    permissions,
    pagination: { page, pageSize: PAGE_SIZE, total, totalPages },
    isSuperAdmin: session.user.isSuperAdmin,
    toast: flash,
  }
}

export default function PermissionsIndex({ loaderData }: Route.ComponentProps) {
  const { permissions, pagination, isSuperAdmin, toast } = loaderData
  const [searchParams, setSearchParams] = useSearchParams()

  useToastFromLoader(toast)

  const systemPermissions = permissions.filter((p) => p.isSystem)
  const customPermissions = permissions.filter((p) => !p.isSystem)

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

  return (
    <div className='p-6'>
      <div className='mb-6 flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-bold'>Permissions Management</h1>
          <p className='text-muted-foreground'>
            Configure granular access control lists. Define resources and
            actions.
          </p>
        </div>
        {isSuperAdmin && (
          <Link to='/permissions/new'>
            <Button>Create Permission</Button>
          </Link>
        )}
      </div>

      {/* System Permissions Section */}
      {systemPermissions.length > 0 && (
        <div className='mb-8'>
          <div className='mb-4'>
            <h2 className='text-lg font-semibold'>System Permissions</h2>
            <p className='text-muted-foreground text-sm'>
              Default permissions that cannot be modified or deleted
            </p>
          </div>
          <div className='rounded-lg border'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Resource</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {systemPermissions.map((permission) => (
                  <TableRow key={permission.id}>
                    <TableCell className='font-medium'>
                      {permission.resource}
                    </TableCell>
                    <TableCell>{permission.action}</TableCell>
                    <TableCell className='text-muted-foreground'>
                      {permission.description || 'No description'}
                    </TableCell>
                    <TableCell>
                      <Badge variant='secondary'>System</Badge>
                    </TableCell>
                    <TableCell>
                      <Link
                        to={`/permissions/${permission.id}`}
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
        </div>
      )}

      {/* Custom Permissions Section */}
      {customPermissions.length > 0 && (
        <div className='mb-8'>
          <div className='mb-4'>
            <h2 className='text-lg font-semibold'>Custom Permissions</h2>
            <p className='text-muted-foreground text-sm'>
              Permissions created by administrators
            </p>
          </div>
          <div className='rounded-lg border'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Resource</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customPermissions.map((permission) => (
                  <TableRow key={permission.id}>
                    <TableCell className='font-medium'>
                      {permission.resource}
                    </TableCell>
                    <TableCell>{permission.action}</TableCell>
                    <TableCell className='text-muted-foreground'>
                      {permission.description || 'No description'}
                    </TableCell>
                    <TableCell>
                      <Badge>Custom</Badge>
                    </TableCell>
                    <TableCell className='flex gap-2'>
                      {isSuperAdmin && (
                        <Link
                          to={`/permissions/${permission.id}/edit`}
                          className='text-primary text-sm font-medium hover:underline'
                        >
                          Edit
                        </Link>
                      )}
                      <Link
                        to={`/permissions/${permission.id}`}
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
        </div>
      )}

      {/* Empty State */}
      {permissions.length === 0 && (
        <div className='rounded-lg border border-dashed p-8 text-center'>
          <p className='text-muted-foreground mb-4'>
            No permissions found. Create your first permission to get started.
          </p>
          {isSuperAdmin && (
            <Link to='/permissions/new'>
              <Button>Create Permission</Button>
            </Link>
          )}
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className='mt-6 flex items-center justify-between'>
          <p className='text-muted-foreground text-sm'>
            Showing {(pagination.page - 1) * pagination.pageSize + 1} to{' '}
            {Math.min(pagination.page * pagination.pageSize, pagination.total)}{' '}
            of {pagination.total} permissions
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
    </div>
  )
}
