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
import { BUSINESS_PARTNER_MESSAGES } from '~/features/business-partners/messages'
import { updateBusinessPartner } from '~/features/business-partners/server/actions/update.action'
import { businessPartnersRepository } from '~/features/business-partners/server/repository'
import { requireAuth } from '~/server/auth/session.server'
import { redirectWithFlash } from '~/server/flash.server'
import type { Route } from './+types/edit'

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

  return (
    <div className='mx-auto max-w-4xl p-6'>
      <Card>
        <CardHeader>
          <CardTitle>Edit Business Partner</CardTitle>
          <CardDescription>
            Update the details for this business partner
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
                  Partner Name *
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
                  Partner Type *
                </label>
                <input type='hidden' name='type' value={partnerType} />
                <Select value={partnerType} onValueChange={setPartnerType} required>
                  <SelectTrigger className='w-full'>
                    <SelectValue placeholder='Select partner type' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='client'>Client (Customer)</SelectItem>
                    <SelectItem value='vendor'>Vendor (Supplier)</SelectItem>
                    <SelectItem value='both'>Both Client & Vendor</SelectItem>
                  </SelectContent>
                </Select>
                {actionData?.errors?.type && (
                  <p className='text-destructive mt-1 text-xs'>
                    {actionData.errors.type}
                  </p>
                )}
                <p className='text-muted-foreground mt-1 text-xs'>
                  Choose how you do business with this partner
                </p>
              </div>
            </div>

            <div className='grid gap-6 sm:grid-cols-2'>
              <div>
                <label htmlFor='email' className='mb-2 block text-sm font-medium'>
                  Email Address
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
                  Optional - Primary contact email
                </p>
              </div>

              <div>
                <label htmlFor='phone' className='mb-2 block text-sm font-medium'>
                  Phone Number
                </label>
                <input
                  type='tel'
                  id='phone'
                  name='phone'
                  defaultValue={partner.phone || ''}
                  placeholder='+502 1234-5678'
                  className='border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none'
                />
                {actionData?.errors?.phone && (
                  <p className='text-destructive mt-1 text-xs'>
                    {actionData.errors.phone}
                  </p>
                )}
                <p className='text-muted-foreground mt-1 text-xs'>
                  Optional - Contact phone number
                </p>
              </div>
            </div>

            <div>
              <label htmlFor='notes' className='mb-2 block text-sm font-medium'>
                Notes
              </label>
              <textarea
                id='notes'
                name='notes'
                rows={3}
                defaultValue={partner.notes || ''}
                placeholder='Additional notes about this partner...'
                className='border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none'
              />
              {actionData?.errors?.notes && (
                <p className='text-destructive mt-1 text-xs'>
                  {actionData.errors.notes}
                </p>
              )}
              <p className='text-muted-foreground mt-1 text-xs'>
                Optional - Internal notes (max 1000 characters)
              </p>
            </div>
          </CardContent>
          <CardFooter className='flex justify-end gap-3 border-t pt-6'>
            <Button type='button' variant='outline' asChild>
              <a href={`/business-partners/${partner.id}`}>Cancel</a>
            </Button>
            <Button type='submit' disabled={isSubmitting || !partnerType}>
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </CardFooter>
        </Form>
      </Card>
    </div>
  )
}
