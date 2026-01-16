import { Link, useSearchParams } from 'react-router'
import { Button } from '~/components/ui/button'
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
import { useCanPerformAction } from '~/hooks/usePermissions'
import { useToastFromLoader } from '~/hooks/useToastFromLoader'
import { requireAuth } from '~/server/auth/session.server'
import { getFlash } from '~/server/flash.server'
import type { PartnerType } from '../schemas'
import { businessPartnersRepository } from '../server/repository'
import type { Route } from './+types/index'

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

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'client':
        return 'bg-blue-100 text-blue-700'
      case 'vendor':
        return 'bg-green-100 text-green-700'
      case 'both':
        return 'bg-purple-100 text-purple-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  return (
    <div className='p-6'>
      <div className='mb-6 flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-bold'>Business Partners</h1>
          <p className='text-muted-foreground'>
            Manage your clients and vendors
          </p>
        </div>
        {canCreatePartner && (
          <Link to='/business-partners/new'>
            <Button>Add Partner</Button>
          </Link>
        )}
      </div>

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
        <div className='rounded-lg border'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Created</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {partners.map((partner) => (
                <TableRow key={partner.id}>
                  <TableCell className='font-medium'>{partner.name}</TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getTypeBadgeColor(
                        partner.type
                      )}`}
                    >
                      {partner.type === 'both'
                        ? 'Client & Vendor'
                        : partner.type.charAt(0).toUpperCase() +
                          partner.type.slice(1)}
                    </span>
                  </TableCell>
                  <TableCell>
                    {partner.email ? (
                      <a
                        href={`mailto:${partner.email}`}
                        className='text-primary hover:underline'
                      >
                        {partner.email}
                      </a>
                    ) : (
                      <span className='text-muted-foreground'>—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {new Date(partner.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Link
                      to={`/business-partners/${partner.id}`}
                      className='text-primary text-sm font-medium hover:underline'
                    >
                      View →
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
