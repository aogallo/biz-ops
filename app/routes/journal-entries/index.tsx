import { format } from 'date-fns'
import { Eye } from 'lucide-react'
import { Link, useSearchParams } from 'react-router'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '~/components/ui/table'
import { companyRepository } from '~/features/company/server/repository/company.repository'
import { journalEntryRepository } from '~/features/journal-entry/server/repository'
import { requireAuth } from '~/server/auth/session.server'
import type { Route } from './+types'

const PAGE_SIZE = 10

export async function loader({ request }: Route.LoaderArgs) {
  const session = await requireAuth(request)
  const url = new URL(request.url)

  if (!session.session.activeOrganizationId) {
    return {
      entries: [],
      companies: [],
      total: 0,
      page: 1,
      pageSize: PAGE_SIZE,
    }
  }

  const organizationId = session.session.activeOrganizationId
  const page = parseInt(url.searchParams.get('page') || '1', 10)
  const companyId = url.searchParams.get('companyId') || undefined
  const status = url.searchParams.get('status') as
    | 'draft'
    | 'posted'
    | 'voided'
    | undefined

  const [{ entries, total }, companies] = await Promise.all([
    journalEntryRepository.getPaginated(organizationId, {
      companyId,
      status,
      limit: PAGE_SIZE,
      offset: (page - 1) * PAGE_SIZE,
    }),
    companyRepository.getByOrganization(organizationId),
  ])

  return {
    entries,
    companies,
    total,
    page,
    pageSize: PAGE_SIZE,
  }
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'draft':
      return <Badge variant='secondary'>Draft</Badge>
    case 'posted':
      return (
        <Badge variant='default' className='bg-green-600'>
          Posted
        </Badge>
      )
    case 'voided':
      return <Badge variant='destructive'>Voided</Badge>
    default:
      return <Badge variant='outline'>{status}</Badge>
  }
}

export default function JournalEntriesIndex({
  loaderData,
}: Route.ComponentProps) {
  const { entries, companies, total, page, pageSize } = loaderData
  const [searchParams, setSearchParams] = useSearchParams()

  const totalPages = Math.ceil(total / pageSize)

  const handleCompanyChange = (value: string) => {
    const params = new URLSearchParams(searchParams)
    if (value && value !== 'all') {
      params.set('companyId', value)
    } else {
      params.delete('companyId')
    }
    params.set('page', '1')
    setSearchParams(params)
  }

  const handleStatusChange = (value: string) => {
    const params = new URLSearchParams(searchParams)
    if (value && value !== 'all') {
      params.set('status', value)
    } else {
      params.delete('status')
    }
    params.set('page', '1')
    setSearchParams(params)
  }

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams)
    params.set('page', String(newPage))
    setSearchParams(params)
  }

  return (
    <div className='container mx-auto py-6'>
      <Card>
        <CardHeader>
          <div className='flex items-center justify-between'>
            <div>
              <CardTitle>Journal Entries</CardTitle>
              <CardDescription>
                View and manage accounting journal entries
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className='mb-4 flex items-center gap-4'>
            <Select
              value={searchParams.get('companyId') || 'all'}
              onValueChange={handleCompanyChange}
            >
              <SelectTrigger className='w-48'>
                <SelectValue placeholder='All Companies' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>All Companies</SelectItem>
                {companies.map((company) => (
                  <SelectItem key={company.id} value={company.id}>
                    {company.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={searchParams.get('status') || 'all'}
              onValueChange={handleStatusChange}
            >
              <SelectTrigger className='w-36'>
                <SelectValue placeholder='All Status' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>All Status</SelectItem>
                <SelectItem value='draft'>Draft</SelectItem>
                <SelectItem value='posted'>Posted</SelectItem>
                <SelectItem value='voided'>Voided</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className='rounded-md border'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Entry #</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead className='text-right'>Debit</TableHead>
                  <TableHead className='text-right'>Credit</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className='w-[80px]'>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className='text-muted-foreground py-8 text-center'
                    >
                      No journal entries found
                    </TableCell>
                  </TableRow>
                ) : (
                  entries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell className='font-medium'>
                        {entry.entryNumber}
                      </TableCell>
                      <TableCell>
                        {format(new Date(entry.entryDate), 'dd/MM/yyyy')}
                      </TableCell>
                      <TableCell className='max-w-50 truncate'>
                        {entry.description}
                      </TableCell>
                      <TableCell>{entry.company?.name || '-'}</TableCell>
                      <TableCell className='text-right font-mono'>
                        Q {Number(entry.totalDebit).toFixed(2)}
                      </TableCell>
                      <TableCell className='text-right font-mono'>
                        Q {Number(entry.totalCredit).toFixed(2)}
                      </TableCell>
                      <TableCell>{getStatusBadge(entry.status)}</TableCell>
                      <TableCell>
                        <Button variant='ghost' size='icon' asChild>
                          <Link to={`/journal-entries/${entry.id}`}>
                            <Eye className='h-4 w-4' />
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className='mt-4 flex items-center justify-between'>
              <div className='text-muted-foreground text-sm'>
                Showing {(page - 1) * pageSize + 1} to{' '}
                {Math.min(page * pageSize, total)} of {total} entries
              </div>
              <div className='flex gap-2'>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page <= 1}
                >
                  Previous
                </Button>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page >= totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
