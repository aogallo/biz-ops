import type { ColumnDef } from '@tanstack/react-table'
import { useMemo } from 'react'
import { Link, useSearchParams } from 'react-router'
import { DataTable } from '~/components/dataTable/DataTable'
import TitleAndActions from '~/components/TitleAndActions'
import { Button } from '~/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'
import type { PartnerType } from '~/features/business-partners/schemas'
import { businessPartnersRepository } from '~/features/business-partners/server/repository'
import { useCanPerformAction } from '~/hooks/usePermissions'
import { useToastFromLoader } from '~/hooks/useToastFromLoader'
import { requireAuth } from '~/server/auth/session.server'
import { getFlash } from '~/server/flash.server'
import type { Route } from './+types/index'

type BusinessPartner = Awaited<
  ReturnType<typeof businessPartnersRepository.getAllByOrganization>
>[number]

export async function loader({ request }: Route.LoaderArgs) {
  const session = await requireAuth(request)
  const url = new URL(request.url)
  const typeFilter = url.searchParams.get('type') as PartnerType | null

  // Get flash message and headers to clear it
  const { flash } = getFlash(request)

  const organizationId = session.session.activeOrganizationId
  if (!organizationId) {
    return {
      partners: [],
      noOrganization: true,
      selectedType: typeFilter,
      toast: flash,
    }
  }

  const partners = await businessPartnersRepository.getAllByOrganization(
    organizationId,
    typeFilter || undefined
  )

  return {
    partners,
    noOrganization: false,
    selectedType: typeFilter,
    toast: flash,
  }
}

export default function BusinessPartnersIndex({
  loaderData,
}: Route.ComponentProps) {
  const {
    partners,
    noOrganization,
    selectedType,
    toast: toastData,
  } = loaderData
  const [searchParams, setSearchParams] = useSearchParams()
  const canCreatePartner = useCanPerformAction('business-partners.create')

  // Show toast if present in loader data
  useToastFromLoader(toastData)

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'client':
        return 'status-info' // Blue for clients
      case 'vendor':
        return 'status-success' // Green for vendors
      case 'both':
        return 'bg-purple-500/10 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400'
      default:
        return 'status-muted'
    }
  }

  const columns = useMemo<ColumnDef<BusinessPartner>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Name',
        cell: ({ row }) => (
          <span className="font-medium">{row.getValue('name')}</span>
        ),
      },
      {
        accessorKey: 'nit',
        header: 'NIT',
        cell: ({ row }) => (
          <span className="font-medium">{row.getValue('nit')}</span>
        ),
      },
      {
        accessorKey: 'type',
        header: 'Type',
        cell: ({ row }) => {
          const type = row.getValue('type') as string
          return (
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getTypeBadgeColor(type)}`}
            >
              {type === 'both'
                ? 'Client & Vendor'
                : type.charAt(0).toUpperCase() + type.slice(1)}
            </span>
          )
        },
      },
      {
        accessorKey: 'email',
        header: 'Email',
        cell: ({ row }) => {
          const email = row.getValue('email') as string | null
          return email ? (
            <a href={`mailto:${email}`} className="text-primary hover:underline">
              {email}
            </a>
          ) : (
            <span className="text-muted-foreground">-</span>
          )
        },
      },
      {
        accessorKey: 'createdAt',
        header: 'Created',
        cell: ({ row }) => {
          const date = row.getValue('createdAt') as Date
          return <div>{new Date(date).toLocaleDateString()}</div>
        },
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <Link
            to={`/business-partners/${row.original.id}`}
            className="text-primary text-sm font-medium hover:underline"
          >
            View
          </Link>
        ),
      },
    ],
    []
  )

  if (noOrganization) {
    return (
      <div className='p-6'>
        <div className='rounded-lg border border-dashed p-8 text-center'>
          <p className='text-muted-foreground mb-4'>
            Please select an organization to view business partners.
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
      <TitleAndActions
        title='Business Partners'
        subtitle='Manage your clients and vendors'
      >
        {canCreatePartner && (
          <Link to='/business-partners/new'>
            <Button>Add Partner</Button>
          </Link>
        )}
      </TitleAndActions>

      <div className='mb-4 flex items-center gap-4'>
        <Select
          value={selectedType || 'all'}
          onValueChange={(value) => {
            if (value === 'all') {
              searchParams.delete('type')
              setSearchParams(searchParams)
            } else {
              setSearchParams({ type: value })
            }
          }}
        >
          <SelectTrigger className='w-50'>
            <SelectValue placeholder='Filter by type' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>All Partners</SelectItem>
            <SelectItem value='client'>Clients Only</SelectItem>
            <SelectItem value='vendor'>Vendors Only</SelectItem>
            <SelectItem value='both'>Both</SelectItem>
          </SelectContent>
        </Select>
        <p className='text-muted-foreground text-sm'>
          Showing {partners.length} partner{partners.length !== 1 ? 's' : ''}
        </p>
      </div>

      {partners.length === 0 ? (
        <div className='rounded-lg border border-dashed p-8 text-center'>
          <p className='text-muted-foreground mb-4'>
            {selectedType
              ? `No ${selectedType} partners found.`
              : 'No business partners found. Add your first partner to get started.'}
          </p>
          {canCreatePartner && (
            <Link to='/business-partners/new'>
              <Button>Add Partner</Button>
            </Link>
          )}
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={partners}
          enableSearch
          searchPlaceholder="Search partners..."
        />
      )}
    </div>
  )
}
