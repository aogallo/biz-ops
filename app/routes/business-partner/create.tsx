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
import { createBusinessPartner } from '~/features/business-partners/server/actions/create.action'
import { useTranslation } from '~/i18n/context'
import type { Route } from './+types/create'

export async function loader({ request }: Route.LoaderArgs) {
  const { requireAuth } = await import('~/server/auth/session.server')
  await requireAuth(request)
  return {}
}

export async function action({ request }: Route.ActionArgs) {
  const response = await createBusinessPartner(request)

  if (response.success && response.data) {
    return redirect(`/business-partners/${response.data.id}`)
  }

  return response
}

export default function CreateBusinessPartner() {
  const actionData = useActionData<typeof action>()
  const navigation = useNavigation()
  const isSubmitting = navigation.state === 'submitting'
  const [partnerType, setPartnerType] = useState<string>('')
  const { t } = useTranslation()

  return (
    <div className='mx-auto max-w-4xl p-6'>
      <Card>
        <CardHeader>
          <CardTitle>{t('partners.createTitle')}</CardTitle>
          <CardDescription>
            {t('partners.createDescription')}
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
              <a href='/business-partners'>{t('common.cancel')}</a>
            </Button>
            <Button type='submit' disabled={isSubmitting || !partnerType}>
              {isSubmitting ? t('partners.creating') : t('partners.createButton')}
            </Button>
          </CardFooter>
        </Form>
      </Card>
    </div>
  )
}
