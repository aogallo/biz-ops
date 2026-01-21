import { useEffect } from 'react'
import {
  Form,
  Link,
  redirect,
  useActionData,
  useNavigation,
} from 'react-router'
import { toast } from 'sonner'
import { Button } from '~/components/ui/button'
import { createCompany } from '../server/actions/create.action.server'
import type { Route } from './+types'

export async function action({ request }: Route.ActionArgs) {
  const response = await createCompany(request)
  if (response.success && response.data) {
    return redirect(`/company/${response.data.id}`)
  }
  return response
}

export default function CreateCompany() {
  const actionData = useActionData<typeof action>()
  const navigation = useNavigation()
  const isSubmitting = navigation.state === 'submitting'

  useEffect(() => {
    if (actionData?.message && !actionData.success) {
      toast.error(actionData.message)
    }
  }, [actionData])

  return (
    <div className='mx-auto max-w-2xl p-6'>
      <h2 className='mb-6 text-2xl font-bold'>Add Company</h2>

      <Form method='post' className='space-y-6'>
        <div>
          <label htmlFor='name' className='mb-2 block text-sm font-medium'>
            Company Name *
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
          <label htmlFor='nit' className='mb-2 block text-sm font-medium'>
            NIT *
          </label>
          <input
            type='text'
            id='nit'
            name='nit'
            required
            placeholder='Nit'
            className='border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none'
          />
          {actionData?.errors?.nit && (
            <p className='text-destructive mt-1 text-xs'>
              {actionData.errors.nit}
            </p>
          )}
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
            className='border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none'
          />
          {actionData?.errors?.email && (
            <p className='text-destructive mt-1 text-xs'>
              {actionData.errors.email}
            </p>
          )}
          <p className='text-muted-foreground mt-1 text-xs'>
            Optional - Primary contact email for this company
          </p>
        </div>

        <div className='flex gap-3'>
          <Button type='submit' disabled={isSubmitting}>
            {isSubmitting ? 'Creating...' : 'Create Company'}
          </Button>
          <Button type='button' variant='outline' asChild>
            <Link to='/company'>Cancel</Link>
          </Button>
        </div>
      </Form>
    </div>
  )
}
