import { useState } from 'react'
import { Form, redirect, useActionData, useNavigation } from 'react-router'
import { Button } from '~/components/ui/button'
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
    <div className='mx-auto max-w-2xl p-6'>
      <h1 className='mb-6 text-2xl font-bold'>Edit Business Partner</h1>

      <Form method='post' className='space-y-6'>
        {actionData?.message && !actionData.success && (
          <div className='bg-destructive/10 text-destructive rounded-md p-4 text-sm'>
            {actionData.message}
          </div>
        )}

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
            Optional - Primary contact email for this partner
          </p>
        </div>

        <div className='flex gap-3'>
          <Button type='submit' disabled={isSubmitting || !partnerType}>
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </Button>
          <Button type='button' variant='outline' asChild>
            <a href={`/business-partners/${partner.id}`}>Cancel</a>
          </Button>
        </div>
      </Form>
    </div>
  )
}
