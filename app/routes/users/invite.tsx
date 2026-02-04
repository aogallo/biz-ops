import {
  Form,
  Link,
  useActionData,
  useNavigation,
  useSearchParams,
} from 'react-router'
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
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from '~/components/ui/field'
import { Input } from '~/components/ui/input'
import { Combobox } from '~/components/ui/combobox'
import { organizationRepository } from '~/features/organization/server/repository'
import { getRolesByOrganization } from '~/server/auth/roles.server'
import { requireAuth } from '~/server/auth/session.server'
import { redirectWithFlash } from '~/server/flash.server'
import { isSuperAdmin } from '~/server/permissions'
import { USER_MESSAGES } from '../../features/users/messages'
import { inviteUser } from '../../features/users/server/actions/invite.action'
import type { Route } from './+types/invite'

export async function loader({ request }: Route.LoaderArgs) {
  const session = await requireAuth(request)
  const url = new URL(request.url)

  // Check if user is super admin
  const isSuperAdminUser = await isSuperAdmin(session.user.id)

  // Get organization ID from searchParams or fall back to active org
  const searchParamOrgId = url.searchParams.get('organizationId')
  const activeOrgId = session.session.activeOrganizationId

  // Determine selected organization ID
  let selectedOrganizationId: string | null = null
  let organizations: Awaited<ReturnType<typeof organizationRepository.getAll>> =
    []

  if (isSuperAdminUser) {
    // Super admin can select any org
    organizations = await organizationRepository.getAll()
    selectedOrganizationId =
      searchParamOrgId || organizations[0]?.id || activeOrgId
  } else {
    // Regular user uses their active org
    selectedOrganizationId = activeOrgId
  }

  if (!selectedOrganizationId) {
    return redirectWithFlash('/users', {
      type: 'error',
      message: USER_MESSAGES.noOrganization,
    })
  }

  // Fetch roles for the selected organization
  const roles = await getRolesByOrganization(selectedOrganizationId)

  return {
    organizations,
    roles,
    selectedOrganizationId,
    isSuperAdmin: isSuperAdminUser,
  }
}

export async function action({ request }: Route.ActionArgs) {
  const response = await inviteUser(request)

  if (response.success) {
    return redirectWithFlash('/users', {
      type: 'success',
      message: USER_MESSAGES.invited,
    })
  }

  return response
}

export default function InviteUserPage({ loaderData }: Route.ComponentProps) {
  const { organizations, roles, selectedOrganizationId, isSuperAdmin } =
    loaderData
  const [, setSearchParams] = useSearchParams()
  const actionData = useActionData<typeof action>()
  const navigation = useNavigation()
  const isSubmitting = navigation.state === 'submitting'

  // Get default member role if available
  const memberRole = roles.find((r) => r.name === 'member')
  const defaultRoleId = memberRole?.id || ''

  // Handle organization change - update URL to trigger loader
  const handleOrganizationChange = (orgId: string) => {
    if (orgId) {
      setSearchParams({ organizationId: orgId })
    }
  }

  return (
    <div className='container mx-auto max-w-4xl py-6'>
      <div className='mb-6'>
        <h1 className='text-3xl font-bold'>Invite User</h1>
        <p className='text-muted-foreground'>
          Send an invitation email to add a new user to your organization
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>User Invitation</CardTitle>
          <CardDescription>
            The user will receive an email with instructions to create their
            account
          </CardDescription>
        </CardHeader>
        <Form method='post'>
          <CardContent>
            {actionData?.message && !actionData.success && (
              <div className='bg-destructive/10 text-destructive mb-4 rounded-md p-3 text-sm'>
                {actionData.message}
              </div>
            )}

            <FieldGroup>
              <div className='grid gap-6 sm:grid-cols-2'>
                <Field>
                  <FieldLabel htmlFor='email'>Email *</FieldLabel>
                  <Input
                    id='email'
                    name='email'
                    type='email'
                    placeholder='user@example.com'
                    required
                    disabled={isSubmitting}
                  />
                  <FieldDescription>
                    The email address where the invitation will be sent
                  </FieldDescription>
                  {actionData?.errors?.email && (
                    <p className='text-destructive mt-1 text-sm'>
                      {actionData.errors.email}
                    </p>
                  )}
                </Field>

                {isSuperAdmin ? (
                  <Field>
                    <FieldLabel htmlFor='organization'>Organization</FieldLabel>
                    <Combobox
                      name='organizationId'
                      value={selectedOrganizationId}
                      onValueChange={handleOrganizationChange}
                      disabled={isSubmitting}
                      options={organizations.map((organization) => ({
                        value: organization.id,
                        label: organization.name,
                      }))}
                      placeholder='Select organization'
                      searchPlaceholder='Search organizations...'
                      emptyMessage='No organizations found.'
                    />
                    <FieldDescription>
                      The organization the user will be invited to
                    </FieldDescription>
                    {actionData?.errors?.organizationId && (
                      <p className='text-destructive mt-1 text-sm'>
                        {actionData.errors.organizationId}
                      </p>
                    )}
                  </Field>
                ) : (
                  <input
                    type='hidden'
                    name='organizationId'
                    value={selectedOrganizationId}
                  />
                )}
              </div>

              <Field>
                <FieldLabel htmlFor='role'>Role</FieldLabel>
                <Combobox
                  key={selectedOrganizationId}
                  name='roleId'
                  defaultValue={defaultRoleId}
                  disabled={isSubmitting}
                  options={roles.map((role) => ({
                    value: role.id,
                    label: role.name,
                    description: role.description || undefined,
                  }))}
                  placeholder='Select role (defaults to member)'
                  searchPlaceholder='Search roles...'
                  emptyMessage='No roles found.'
                />
                <FieldDescription>
                  The role that will be assigned to the user in your
                  organization
                </FieldDescription>
                {actionData?.errors?.roleId && (
                  <p className='text-destructive mt-1 text-sm'>
                    {actionData.errors.roleId}
                  </p>
                )}
              </Field>
            </FieldGroup>
          </CardContent>
          <CardFooter className='flex justify-end gap-3 border-t pt-6'>
            <Link to='/users'>
              <Button
                type='button'
                variant='outline'
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            </Link>
            <Button type='submit' disabled={isSubmitting}>
              {isSubmitting ? 'Sending...' : 'Send Invitation'}
            </Button>
          </CardFooter>
        </Form>
      </Card>
    </div>
  )
}
