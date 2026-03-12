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
import { useTranslation } from '~/i18n/context'
import { organizationRepository } from '~/features/organization/server/repository'
import { getRolesByOrganization } from '~/server/auth/roles.server'
import { requireAuth } from '~/server/auth/session.server'
import { getLocaleFromRequest, translateServer } from '~/i18n/translate.server'
import { redirectWithFlash } from '~/server/flash.server'
import { isSuperAdmin } from '~/server/permissions'
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

  const locale = getLocaleFromRequest(request)

  if (!selectedOrganizationId) {
    return redirectWithFlash('/users', {
      type: 'error',
      message: translateServer(locale, 'messages.users.noOrganization'),
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
  const locale = getLocaleFromRequest(request)
  const response = await inviteUser(request)

  if (response.success) {
    return redirectWithFlash('/users', {
      type: 'success',
      message: translateServer(locale, 'messages.users.invited'),
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
  const { t } = useTranslation()

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
        <h1 className='text-3xl font-bold'>{t('users.inviteUser')}</h1>
        <p className='text-muted-foreground'>{t('users.inviteDescription')}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('users.inviteTitle')}</CardTitle>
          <CardDescription>{t('users.inviteNote')}</CardDescription>
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
                  <FieldLabel htmlFor='email'>
                    {t('users.emailLabel')}
                  </FieldLabel>
                  <Input
                    id='email'
                    name='email'
                    type='email'
                    placeholder={t('users.emailPlaceholder')}
                    required
                    disabled={isSubmitting}
                  />
                  <FieldDescription>{t('users.emailHelper')}</FieldDescription>
                  {actionData?.errors?.email && (
                    <p className='text-destructive mt-1 text-sm'>
                      {actionData.errors.email}
                    </p>
                  )}
                </Field>

                {isSuperAdmin ? (
                  <Field>
                    <FieldLabel htmlFor='organization'>
                      {t('users.organizationLabel')}
                    </FieldLabel>
                    <Combobox
                      name='organizationId'
                      value={selectedOrganizationId}
                      onValueChange={handleOrganizationChange}
                      disabled={isSubmitting}
                      options={organizations.map((organization) => ({
                        value: organization.id,
                        label: organization.name,
                      }))}
                      placeholder={t('users.selectOrganization')}
                      searchPlaceholder={t('users.searchOrganizations')}
                      emptyMessage={t('users.noOrganizationsFound')}
                    />
                    <FieldDescription>
                      {t('users.organizationHelper')}
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
                <FieldLabel htmlFor='role'>{t('users.roleLabel')}</FieldLabel>
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
                  placeholder={t('users.rolePlaceholder')}
                  searchPlaceholder='Search roles...'
                  emptyMessage='No roles found.'
                />
                <FieldDescription>{t('users.roleHelper')}</FieldDescription>
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
              <Button type='button' variant='outline' disabled={isSubmitting}>
                {t('common.cancel')}
              </Button>
            </Link>
            <Button type='submit' disabled={isSubmitting}>
              {isSubmitting ? t('users.sending') : t('users.sendInvitation')}
            </Button>
          </CardFooter>
        </Form>
      </Card>
    </div>
  )
}
