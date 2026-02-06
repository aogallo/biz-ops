import type { ColumnDef } from '@tanstack/react-table'
import { format } from 'date-fns'
import { Eye, Plus } from 'lucide-react'
import { useMemo } from 'react'
import { Link, useSearchParams } from 'react-router'
import { DataTable } from '~/components/dataTable/DataTable'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card'
import { Combobox } from '~/components/ui/combobox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'
import { companyRepository } from '~/features/company/server/repository/company.repository'
import { journalEntryRepository, type JournalEntryWithLines } from '~/features/journal-entry/server/repository'
import { requireAuth } from '~/server/auth/session.server'
import type { Route } from './+types'

export async function loader({ request }: Route.LoaderArgs) {
  const session = await requireAuth(request)
  const url = new URL(request.url)

  if (!session.session.activeOrganizationId) {
    return {
      entries: [],
      companies: [],
    }
  }

  const organizationId = session.session.activeOrganizationId
  const companyId = url.searchParams.get('companyId') || undefined
  const status = url.searchParams.get('status') as
    | 'draft'
    | 'posted'
    | 'voided'
    | undefined

  const [entries, companies] = await Promise.all([
    journalEntryRepository.getAll(organizationId, { companyId, status }),
    companyRepository.getByOrganization(organizationId),
  ])

  return {
    entries,
    companies,
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
  const { entries, companies } = loaderData
  const [searchParams, setSearchParams] = useSearchParams()

  const handleCompanyChange = (value: string) => {
    const params = new URLSearchParams(searchParams)
    if (value && value !== 'all') {
      params.set('companyId', value)
    } else {
      params.delete('companyId')
    }
    setSearchParams(params)
  }

  const handleStatusChange = (value: string) => {
    const params = new URLSearchParams(searchParams)
    if (value && value !== 'all') {
      params.set('status', value)
    } else {
      params.delete('status')
    }
    setSearchParams(params)
  }

  const columns = useMemo<ColumnDef<JournalEntryWithLines>[]>(
    () => [
      {
        accessorKey: 'entryNumber',
        header: 'Entry #',
        cell: ({ row }) => (
          <span className="font-medium">{row.getValue('entryNumber')}</span>
        ),
      },
      {
        accessorKey: 'entryDate',
        header: 'Date',
        cell: ({ row }) => {
          const date = row.getValue('entryDate') as Date
          return <div>{format(new Date(date), 'dd/MM/yyyy')}</div>
        },
      },
      {
        accessorKey: 'description',
        header: 'Description',
        cell: ({ row }) => (
          <div className="max-w-50 truncate">{row.getValue('description')}</div>
        ),
      },
      {
        accessorKey: 'company',
        header: 'Company',
        cell: ({ row }) => {
          const company = row.original.company
          return <div>{company?.name || '-'}</div>
        },
      },
      {
        accessorKey: 'totalDebit',
        header: () => <div className="text-right">Debit</div>,
        cell: ({ row }) => {
          const debit = row.getValue('totalDebit') as string | number
          return (
            <div className="text-right font-mono">
              Q {Number(debit).toFixed(2)}
            </div>
          )
        },
      },
      {
        accessorKey: 'totalCredit',
        header: () => <div className="text-right">Credit</div>,
        cell: ({ row }) => {
          const credit = row.getValue('totalCredit') as string | number
          return (
            <div className="text-right font-mono">
              Q {Number(credit).toFixed(2)}
            </div>
          )
        },
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => getStatusBadge(row.getValue('status')),
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <Button variant='ghost' size='icon' asChild>
            <Link to={`/journal-entries/${row.original.id}`}>
              <Eye className='h-4 w-4' />
            </Link>
          </Button>
        ),
      },
    ],
    []
  )

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
            <Button asChild>
              <Link to='/journal-entries/new'>
                <Plus className='mr-2 h-4 w-4' />
                New Entry
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className='mb-4 flex items-center gap-4'>
            <Combobox
              value={searchParams.get('companyId') || 'all'}
              onValueChange={handleCompanyChange}
              options={[
                { value: 'all', label: 'All Companies' },
                ...companies.map((company) => ({
                  value: company.id,
                  label: company.name,
                })),
              ]}
              placeholder='All Companies'
              searchPlaceholder='Search companies...'
              emptyMessage='No companies found.'
              className='w-48'
            />

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

          {entries.length === 0 ? (
            <div className='text-muted-foreground py-8 text-center'>
              No journal entries found
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={entries}
              enableSearch
              searchPlaceholder="Search entries..."
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
