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

  return (
    <div className='mx-auto max-w-4xl p-6'>
      <Card>
        <CardHeader>
          <CardTitle>Add Business Partner</CardTitle>
          <CardDescription>
            Create a new client, vendor, or both for your organization
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

            <div>
              <label htmlFor='email' className='mb-2 block text-sm font-medium'>
                Email Address
              </label>
              <input
                type='email'
                id='email'
                name='email'
                placeholder='contact@example.com'
                className='border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none sm:max-w-md'
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
          </CardContent>
          <CardFooter className='flex justify-end gap-3 border-t pt-6'>
            <Button type='button' variant='outline' asChild>
              <a href='/business-partners'>Cancel</a>
            </Button>
            <Button type='submit' disabled={isSubmitting || !partnerType}>
              {isSubmitting ? 'Creating...' : 'Create Partner'}
            </Button>
          </CardFooter>
        </Form>
      </Card>
    </div>
  )
}
