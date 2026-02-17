import { Link, useSubmit } from 'react-router'
import { useTranslation } from '~/i18n/context'
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
import { deleteBusinessPartner } from '~/features/business-partners/server/actions/delete.action'
import { businessPartnersRepository } from '~/features/business-partners/server/repository'
import { getLocaleFromRequest, translateServer } from '~/i18n/translate.server'
import { requireAuth } from '~/server/auth/session.server'
import { redirectWithFlash } from '~/server/flash.server'
import type { Route } from './+types/show'

export async function loader({ request, params }: Route.LoaderArgs) {
  const session = await requireAuth(request)
  const locale = getLocaleFromRequest(request)
  const { id } = params

  const organizationId = session.session.activeOrganizationId
  if (!organizationId) {
    return redirectWithFlash('/business-partners', {
      type: 'error',
      message: translateServer(locale, 'messages.partners.noOrganization'),
    })
  }

  const partner = await businessPartnersRepository.getByIdForOrganization(
    organizationId,
    id
  )

  if (!partner) {
    return redirectWithFlash('/business-partners', {
      type: 'error',
      message: translateServer(locale, 'messages.partners.notFound'),
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
  const locale = getLocaleFromRequest(request)
  const result = await deleteBusinessPartner(request, id)

  if (result.success) {
    return redirectWithFlash('/business-partners', {
      type: 'success',
      message: translateServer(locale, 'messages.partners.deleted'),
    })
  }

  return result
}

export default function ShowBusinessPartner({
  loaderData,
}: Route.ComponentProps) {
  const { partner, visitHistory, showVisitHistory } = loaderData
  const { t } = useTranslation()
  const submit = useSubmit()

  const handleDelete = () => {
    if (confirm(`${t('partners.details')}: "${partner.name}"`)) {
      submit({}, { method: 'post' })
    }
  }

  const getTypeDisplay = (type: string) => {
    switch (type) {
      case 'client':
        return { label: t('partners.type.client'), description: t('partners.isClient') }
      case 'vendor':
        return { label: t('partners.type.vendor'), description: t('partners.isVendor') }
      case 'both':
        return {
          label: t('partners.type.both'),
          description: t('partners.isBoth'),
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
          <h1 className='text-2xl font-bold'>{t('partners.details')}</h1>
          <p className='text-muted-foreground'>
            {t('partners.detailsDescription')}
          </p>
        </div>
        <div className='flex gap-2'>
          <Link to={`/business-partners/${partner.id}/edit`}>
            <Button variant='outline'>{t('common.edit')}</Button>
          </Link>
          <Button variant='destructive' onClick={handleDelete}>
            {t('common.delete')}
          </Button>
          <Link to='/business-partners'>
            <Button variant='outline'>{t('partners.backToPartners')}</Button>
          </Link>
        </div>
      </div>

      <div className='grid gap-6 md:grid-cols-2'>
        <Card>
          <CardHeader>
            <CardTitle>{t('partners.information')}</CardTitle>
            <CardDescription>{t('partners.infoDescription')}</CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div>
              <label className='text-muted-foreground text-sm font-medium'>
                {t('partners.name')}
              </label>
              <p className='text-xl font-semibold'>{partner.name}</p>
            </div>
            <div>
              <label className='text-muted-foreground text-sm font-medium'>
                {t('partners.nitLabel')}
              </label>
              <p className='text-xl font-semibold'>{partner.nit || '-'}</p>
            </div>
            <div>
              <label className='text-muted-foreground text-sm font-medium'>
                {t('partners.type')}
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
                {t('partners.email')}
              </label>
              {partner.email ? (
                <a
                  href={`mailto:${partner.email}`}
                  className='text-primary block text-lg hover:underline'
                >
                  {partner.email}
                </a>
              ) : (
                <p className='text-muted-foreground'>{t('partners.noEmail')}</p>
              )}
            </div>
            <div>
              <label className='text-muted-foreground text-sm font-medium'>
                {t('partners.phone')}
              </label>
              {partner.phone ? (
                <a
                  href={`tel:${partner.phone}`}
                  className='text-primary block text-lg hover:underline'
                >
                  {partner.phone}
                </a>
              ) : (
                <p className='text-muted-foreground'>{t('partners.noPhone')}</p>
              )}
            </div>
            {partner.notes && (
              <div>
                <label className='text-muted-foreground text-sm font-medium'>
                  {t('common.notes')}
                </label>
                <p className='text-sm whitespace-pre-wrap'>{partner.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('products.metadata')}</CardTitle>
            <CardDescription>{t('products.metadataDescription')}</CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div>
              <label className='text-muted-foreground text-sm font-medium'>
                ID
              </label>
              <p className='font-mono text-sm'>{partner.id}</p>
            </div>
            <div>
              <label className='text-muted-foreground text-sm font-medium'>
                {t('common.created')}
              </label>
              <p className='text-sm'>
                {new Date(partner.createdAt).toLocaleString()}
              </p>
            </div>
            <div>
              <label className='text-muted-foreground text-sm font-medium'>
                {t('common.lastUpdated')}
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
            <CardTitle>{t('partners.visitHistory')}</CardTitle>
            <CardDescription>
              {t('partners.visitHistoryDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {visitHistory.length === 0 ? (
              <div className='rounded-lg border border-dashed p-8 text-center'>
                <p className='text-muted-foreground'>
                  {t('partners.noVisits')}
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('appointments.date')}</TableHead>
                    <TableHead>{t('appointments.time')}</TableHead>
                    <TableHead>{t('appointments.service')}</TableHead>
                    <TableHead>{t('appointments.staff')}</TableHead>
                    <TableHead>{t('common.status')}</TableHead>
                    <TableHead>{t('common.notes')}</TableHead>
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
