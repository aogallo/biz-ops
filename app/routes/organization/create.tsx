import { Form, useActionData, useNavigation } from 'react-router'
import { requireAuth } from '~/server/auth/session.server'
import { redirectWithFlash } from '~/server/flash.server'
import { createOrganization } from '../../features/organization/server/actions/create.action'
import type { Route } from './+types/create'

export async function loader({ request }: Route.LoaderArgs) {
  await requireAuth(request)
  return {}
}

export async function action({ request }: Route.ActionArgs) {
  const data = await request.formData()
  const response = await createOrganization(request, data)
  if (response.success) {
    return redirectWithFlash('/organization', {
      type: 'success',
      message: 'Organization created successfully',
    })
  }
  return response
}

export default function CreateOrganization() {
  const actionData = useActionData<typeof createOrganization>()
  const navigation = useNavigation()

  return (
    <div className='self-stretch p-6'>
      <div className='mx-auto max-w-2xl'>
        <h1 className='text-2xl font-bold'>Create New Organization</h1>

        <Form method='post' className='space-y-6'>
          {actionData?.message && (
            <div className='bg-destructive/10 text-destructive rounded-md p-4 text-sm'>
              {actionData.message}
            </div>
          )}

          <div>
            <label htmlFor='name' className='mb-2 block text-sm font-medium'>
              Organization Name
            </label>
            <input
              type='text'
              id='name'
              name='name'
              required
              placeholder='Acme Corporation'
              className='border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none'
            />
            <p className='text-muted-foreground mt-1 text-xs'>
              The full name of your organization
            </p>
          </div>

          <div>
            <label htmlFor='slug' className='mb-2 block text-sm font-medium'>
              URL Slug
            </label>
            <input
              type='text'
              id='slug'
              name='slug'
              required
              placeholder='acme-corp'
              pattern='[a-z0-9-]+'
              className='border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none'
            />
            <p className='text-muted-foreground mt-1 text-xs'>
              Lowercase letters, numbers, and hyphens only (e.g., acme-corp)
            </p>
          </div>

          <div className='flex gap-3'>
            <button
              type='submit'
              className='bg-primary text-primary-foreground hover:bg-primary/90 rounded-md px-4 py-2 text-sm font-medium'
            >
              {navigation.state === 'submitting' ? 'Creating....' : 'Create'}
            </button>
            <a
              href='/organization'
              className='border-input hover:bg-accent hover:text-accent-foreground rounded-md border px-4 py-2 text-sm font-medium'
            >
              Cancel
            </a>
          </div>
        </Form>
      </div>
    </div>
  )
}
