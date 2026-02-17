import { useState } from 'react'
import { Form, redirect, useActionData, useNavigation } from 'react-router'
import { Button } from '~/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
import { updateBusinessPartner } from '~/features/business-partners/server/actions/update.action'
import { businessPartnersRepository } from '~/features/business-partners/server/repository'
import { useTranslation } from '~/i18n/context'
import { getLocaleFromRequest, translateServer } from '~/i18n/translate.server'
import { requireAuth } from '~/server/auth/session.server'
import { redirectWithFlash } from '~/server/flash.server'
import type { Route } from './+types/edit'

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

  return { partner }
}

export async function action({ request, params }: Route.ActionArgs) {
  const { id } = params
  const response = await updateBusinessPartner(request, id)

  if (response.success) {
    return redirect(`/business-partners/${id}`)
  }

  return response
}

export default function EditBusinessPartner({
  loaderData,
}: Route.ComponentProps) {
  const { partner } = loaderData
  const actionData = useActionData<typeof action>()
  const navigation = useNavigation()
  const isSubmitting = navigation.state === 'submitting'
  const [partnerType, setPartnerType] = useState<string>(partner.type)
  const { t } = useTranslation()

  return (
    <div className='mx-auto max-w-4xl p-6'>
      <Card>
        <CardHeader>
          <CardTitle>{t('partners.editTitle')}</CardTitle>
          <CardDescription>
            {t('partners.editDescription')}
          </CardDescription>
        </CardHeader>
        <Form method='post'>
          <CardContent className='space-y-6'>
            {actionData?.message && !actionData.success && (
              <div className='bg-destructive/10 text-destructive rounded-md p-4 text-sm'>
                {actionData.message}
              </div>
            )}

            <div className='grid gap-6 sm:grid-cols-2'>
              <div>
                <label htmlFor='name' className='mb-2 block text-sm font-medium'>
                  {t('partners.nameLabel')}
                </label>
                <input
                  type='text'
                  id='name'
                  name='name'
                  required
                  defaultValue={partner.name}
                  placeholder='Acme Corporation'
                  className='border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none'
                />
                {actionData?.errors?.name && (
                  <p className='text-destructive mt-1 text-xs'>
                    {actionData.errors.name}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor='type' className='mb-2 block text-sm font-medium'>
                  {t('partners.typeLabel')}
                </label>
                <input type='hidden' name='type' value={partnerType} />
                <Select value={partnerType} onValueChange={setPartnerType} required>
                  <SelectTrigger className='w-full'>
                    <SelectValue placeholder={t('partners.typePlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='client'>{t('partners.type.client')}</SelectItem>
                    <SelectItem value='vendor'>{t('partners.type.vendor')}</SelectItem>
                    <SelectItem value='both'>{t('partners.type.both')}</SelectItem>
                  </SelectContent>
                </Select>
                {actionData?.errors?.type && (
                  <p className='text-destructive mt-1 text-xs'>
                    {actionData.errors.type}
                  </p>
                )}
                <p className='text-muted-foreground mt-1 text-xs'>
                  {t('partners.typeHelper')}
                </p>
              </div>
            </div>

            <div className='grid gap-6 sm:grid-cols-2'>
              <div>
                <label htmlFor='email' className='mb-2 block text-sm font-medium'>
                  {t('partners.email')}
                </label>
                <input
                  type='email'
                  id='email'
                  name='email'
                  defaultValue={partner.email || ''}
                  placeholder='contact@example.com'
                  className='border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none'
                />
                {actionData?.errors?.email && (
                  <p className='text-destructive mt-1 text-xs'>
                    {actionData.errors.email}
                  </p>
                )}
                <p className='text-muted-foreground mt-1 text-xs'>
                  {t('partners.emailOptional')}
                </p>
              </div>

              <div>
                <label htmlFor='phone' className='mb-2 block text-sm font-medium'>
                  {t('partners.phone')}
                </label>
                <input
                  type='tel'
                  id='phone'
                  name='phone'
                  defaultValue={partner.phone || ''}
                  placeholder={t('partners.phonePlaceholder')}
                  className='border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none'
                />
                {actionData?.errors?.phone && (
                  <p className='text-destructive mt-1 text-xs'>
                    {actionData.errors.phone}
                  </p>
                )}
                <p className='text-muted-foreground mt-1 text-xs'>
                  {t('partners.phoneOptional')}
                </p>
              </div>
            </div>

            <div>
              <label htmlFor='notes' className='mb-2 block text-sm font-medium'>
                {t('partners.notes')}
              </label>
              <textarea
                id='notes'
                name='notes'
                rows={3}
                defaultValue={partner.notes || ''}
                placeholder={t('partners.notesPlaceholder')}
                className='border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none'
              />
              {actionData?.errors?.notes && (
                <p className='text-destructive mt-1 text-xs'>
                  {actionData.errors.notes}
                </p>
              )}
              <p className='text-muted-foreground mt-1 text-xs'>
                {t('partners.notesHelper')}
              </p>
            </div>
          </CardContent>
          <CardFooter className='flex justify-end gap-3 border-t pt-6'>
            <Button type='button' variant='outline' asChild>
              <a href={`/business-partners/${partner.id}`}>{t('common.cancel')}</a>
            </Button>
            <Button type='submit' disabled={isSubmitting || !partnerType}>
              {isSubmitting ? t('partners.saving') : t('partners.saveChanges')}
            </Button>
          </CardFooter>
        </Form>
      </Card>
    </div>
  )
}
