import { ChevronDown } from 'lucide-react'
import { useState } from 'react'
import { Form, useActionData, useLoaderData, useNavigation } from 'react-router'
import { Button } from '~/components/ui/button'
import { Checkbox } from '~/components/ui/checkbox'
import { requireAuth } from '~/server/auth/session.server'
import { redirectWithFlash } from '~/server/flash.server'
import { ROLE_MESSAGES } from '../messages'
import { createRole } from '../server/actions/create.action'
import { rolesRepository } from '../server/repository'
import type { Route } from './+types/create'

export async function loader({ request }: Route.LoaderArgs) {
  const session = await requireAuth(request)

  const organizationId = session.session.activeOrganizationId
  if (!organizationId) {
    return redirectWithFlash('/organization', {
      type: 'error',
      message: ROLE_MESSAGES.noOrganization,
    })
  }

  const permissions = await rolesRepository.getAllPermissions()

  // Group permissions by resource
  const permissionsByResource = permissions.reduce(
    (acc, perm) => {
      if (!acc[perm.resource]) {
        acc[perm.resource] = []
      }
      acc[perm.resource].push(perm)
      return acc
    },
    {} as Record<string, typeof permissions>
  )

  return {
    permissionsByResource,
    organizationId,
  }
}

export async function action({ request }: Route.ActionArgs) {
  const response = await createRole(request)

  if (response.success && response.data) {
    return redirectWithFlash(`/roles/${response.data.id}`, {
      type: 'success',
      message: ROLE_MESSAGES.created,
    })
  }

  return response
}

function PermissionSection({
  resource,
  perms,
}: {
  resource: string
  perms: Array<{ id: string; action: string; description: string | null }>
}) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className='border-b last:border-b-0'>
      <button
        type='button'
        onClick={() => setIsOpen(!isOpen)}
        className='hover:bg-accent flex w-full items-center justify-between rounded-md px-3 py-2 text-sm font-medium'
      >
        <span className='capitalize'>
          {resource} ({perms.length})
        </span>
        <ChevronDown
          className={`h-4 w-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>
      <div className={`space-y-2 px-3 py-2 ${isOpen ? '' : 'hidden'}`}>
        {perms.map((perm) => (
          <div key={perm.id} className='flex items-start space-x-3'>
            <Checkbox
              id={perm.id}
              name='permissionIds'
              value={perm.id}
              className='mt-1'
            />
            <label
              htmlFor={perm.id}
              className='flex-1 cursor-pointer text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70'
            >
              <span className='font-medium'>{perm.action}</span>
              {perm.description && (
                <p className='text-muted-foreground mt-1 text-xs'>
                  {perm.description}
                </p>
              )}
            </label>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function CreateRole() {
  const { permissionsByResource } = useLoaderData<typeof loader>()
  const actionData = useActionData<typeof action>()
  const navigation = useNavigation()
  const isSubmitting = navigation.state === 'submitting'

  return (
    <div className='mx-auto max-w-3xl p-6'>
      <h1 className='mb-2 text-2xl font-bold'>Create New Role</h1>
      <p className='text-muted-foreground mb-6'>
        Define a custom role with specific permissions for your organization
      </p>

      <Form method='post' className='space-y-6'>
        {actionData?.message && !actionData.success && (
          <div className='bg-destructive/10 text-destructive rounded-md p-4 text-sm'>
            {actionData.message}
          </div>
        )}

        <div>
          <label htmlFor='name' className='mb-2 block text-sm font-medium'>
            Role Name *
          </label>
          <input
            type='text'
            id='name'
            name='name'
            required
            placeholder='project-manager'
            className='border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none'
          />
          {actionData?.errors?.name && (
            <p className='text-destructive mt-1 text-xs'>
              {actionData.errors.name[0]}
            </p>
          )}
          <p className='text-muted-foreground mt-1 text-xs'>
            Use lowercase letters and hyphens only (e.g., project-manager)
          </p>
        </div>

        <div>
          <label
            htmlFor='description'
            className='mb-2 block text-sm font-medium'
          >
            Description *
          </label>
          <textarea
            id='description'
            name='description'
            required
            rows={3}
            placeholder='Describe what this role can do...'
            className='border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none'
          />
          {actionData?.errors?.description && (
            <p className='text-destructive mt-1 text-xs'>
              {actionData.errors.description[0]}
            </p>
          )}
        </div>

        <div>
          <label className='mb-3 block text-sm font-medium'>
            Permissions * (Select at least one)
          </label>
          {actionData?.errors?.permissionIds && (
            <p className='text-destructive mb-2 text-xs'>
              {actionData.errors.permissionIds[0]}
            </p>
          )}
          <div className='rounded-lg border'>
            {Object.entries(permissionsByResource).map(([resource, perms]) => (
              <PermissionSection
                key={resource}
                resource={resource}
                perms={perms}
              />
            ))}
          </div>
        </div>

        <div className='flex gap-3'>
          <Button type='submit' disabled={isSubmitting}>
            {isSubmitting ? 'Creating...' : 'Create Role'}
          </Button>
          <Button type='button' variant='outline' asChild>
            <a href='/roles'>Cancel</a>
          </Button>
        </div>
      </Form>
    </div>
  )
}
