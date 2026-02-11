import { Link, useSubmit } from 'react-router'
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '~/components/ui/table'
import { appointmentStatusConfig, type AppointmentStatus } from '~/features/appointments/schemas'
import { appointmentsRepository } from '~/features/appointments/server/repository'
import { BUSINESS_PARTNER_MESSAGES } from '~/features/business-partners/messages'
import { deleteBusinessPartner } from '~/features/business-partners/server/actions/delete.action'
import { businessPartnersRepository } from '~/features/business-partners/server/repository'
import { requireAuth } from '~/server/auth/session.server'
import { redirectWithFlash } from '~/server/flash.server'
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

  // Fetch visit history if partner is a client or both
  const showVisitHistory = partner.type === 'client' || partner.type === 'both'
  const visitHistory = showVisitHistory
    ? await appointmentsRepository.getByClient(organizationId, id)
    : []

  return { partner, visitHistory, showVisitHistory }
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
  const { partner, visitHistory, showVisitHistory } = loaderData
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
              <p className='text-xl font-semibold'>{partner.nit || '-'}</p>
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
            <div>
              <label className='text-muted-foreground text-sm font-medium'>
                Phone Number
              </label>
              {partner.phone ? (
                <a
                  href={`tel:${partner.phone}`}
                  className='text-primary block text-lg hover:underline'
                >
                  {partner.phone}
                </a>
              ) : (
                <p className='text-muted-foreground'>No phone provided</p>
              )}
            </div>
            {partner.notes && (
              <div>
                <label className='text-muted-foreground text-sm font-medium'>
                  Notes
                </label>
                <p className='text-sm whitespace-pre-wrap'>{partner.notes}</p>
              </div>
            )}
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

      {showVisitHistory && (
        <Card className='mt-6'>
          <CardHeader>
            <CardTitle>Visit History</CardTitle>
            <CardDescription>
              Past and upcoming appointments for this client
            </CardDescription>
          </CardHeader>
          <CardContent>
            {visitHistory.length === 0 ? (
              <div className='rounded-lg border border-dashed p-8 text-center'>
                <p className='text-muted-foreground'>
                  No appointments found for this client.
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead>Staff</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visitHistory.map((visit) => {
                    const statusConfig = appointmentStatusConfig[visit.status as AppointmentStatus]
                    return (
                      <TableRow key={visit.id}>
                        <TableCell className='font-medium'>
                          {new Date(visit.date + 'T00:00:00').toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          {visit.startTime} - {visit.endTime}
                        </TableCell>
                        <TableCell>{visit.serviceName}</TableCell>
                        <TableCell>{visit.staffName}</TableCell>
                        <TableCell>
                          <Badge variant={statusConfig?.variant || 'outline'}>
                            {statusConfig?.label || visit.status}
                          </Badge>
                        </TableCell>
                        <TableCell className='max-w-[200px] truncate text-muted-foreground'>
                          {visit.notes || '-'}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
