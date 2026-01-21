import { Link, useSubmit } from 'react-router'
import { Button } from '~/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card'
import { requireAuth } from '~/server/auth/session.server'
import { redirectWithFlash } from '~/server/flash.server'
import { BUSINESS_PARTNER_MESSAGES } from '../messages'
import { deleteBusinessPartner } from '../server/actions/delete.action'
import { businessPartnersRepository } from '../server/repository'
import type { Route } from './+types/show'

export async function loader({ request, params }: Route.LoaderArgs) {
  const session = await requireAuth(request)
  const { id } = params

  const organizationId = session.session.activeOrganizationId
  if (!organizationId) {
    return redirectWithFlash('/business-partners', {
      type: 'error',
      message: BUSINESS_PARTNER_MESSAGES.noOrganization,
    })
  }

  const partner = await businessPartnersRepository.getByIdForOrganization(
    organizationId,
    id
  )

  if (!partner) {
    return redirectWithFlash('/business-partners', {
      type: 'error',
      message: BUSINESS_PARTNER_MESSAGES.notFound,
    })
  }

  return { partner }
}

export async function action({ request, params }: Route.ActionArgs) {
  const { id } = params
  const result = await deleteBusinessPartner(request, id)

  if (result.success) {
    return redirectWithFlash('/business-partners', {
      type: 'success',
      message: BUSINESS_PARTNER_MESSAGES.deleted,
    })
  }

  return result
}

export default function ShowBusinessPartner({
  loaderData,
}: Route.ComponentProps) {
  const { partner } = loaderData
  const submit = useSubmit()

  const handleDelete = () => {
    if (
      confirm(
        `Are you sure you want to delete "${partner.name}"? This action cannot be undone.`
      )
    ) {
      submit({}, { method: 'post' })
    }
  }

  const getTypeDisplay = (type: string) => {
    switch (type) {
      case 'client':
        return { label: 'Client', description: 'This partner is a customer' }
      case 'vendor':
        return { label: 'Vendor', description: 'This partner is a supplier' }
      case 'both':
        return {
          label: 'Client & Vendor',
          description: 'This partner is both a customer and supplier',
        }
      default:
        return { label: type, description: '' }
    }
  }

  const typeInfo = getTypeDisplay(partner.type)

  return (
    <div className='p-6'>
      <div className='mb-6 flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-bold'>Business Partner Details</h1>
          <p className='text-muted-foreground'>
            View and manage partner information
          </p>
        </div>
        <div className='flex gap-2'>
          <Link to={`/business-partners/${partner.id}/edit`}>
            <Button variant='outline'>Edit</Button>
          </Link>
          <Button variant='destructive' onClick={handleDelete}>
            Delete
          </Button>
          <Link to='/business-partners'>
            <Button variant='outline'>Back to Partners</Button>
          </Link>
        </div>
      </div>

      <div className='grid gap-6 md:grid-cols-2'>
        <Card>
          <CardHeader>
            <CardTitle>Partner Information</CardTitle>
            <CardDescription>Basic details about this partner</CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div>
              <label className='text-muted-foreground text-sm font-medium'>
                Partner Name
              </label>
              <p className='text-xl font-semibold'>{partner.name}</p>
            </div>
            <div>
              <label className='text-muted-foreground text-sm font-medium'>
                Partner NIT
              </label>
              <p className='text-xl font-semibold'>{partner.nit}</p>
            </div>
            <div>
              <label className='text-muted-foreground text-sm font-medium'>
                Partner Type
              </label>
              <p className='text-primary text-lg font-medium'>
                {typeInfo.label}
              </p>
              <p className='text-muted-foreground text-sm'>
                {typeInfo.description}
              </p>
            </div>
            <div>
              <label className='text-muted-foreground text-sm font-medium'>
                Email Address
              </label>
              {partner.email ? (
                <a
                  href={`mailto:${partner.email}`}
                  className='text-primary block text-lg hover:underline'
                >
                  {partner.email}
                </a>
              ) : (
                <p className='text-muted-foreground'>No email provided</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Metadata</CardTitle>
            <CardDescription>Tracking information</CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div>
              <label className='text-muted-foreground text-sm font-medium'>
                Partner ID
              </label>
              <p className='font-mono text-sm'>{partner.id}</p>
            </div>
            <div>
              <label className='text-muted-foreground text-sm font-medium'>
                Created
              </label>
              <p className='text-sm'>
                {new Date(partner.createdAt).toLocaleString()}
              </p>
            </div>
            <div>
              <label className='text-muted-foreground text-sm font-medium'>
                Last Updated
              </label>
              <p className='text-sm'>
                {new Date(partner.updatedAt).toLocaleString()}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
