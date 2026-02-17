import { eq } from 'drizzle-orm'
import { Form, Link, redirect } from 'react-router'
import { Button } from '~/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card'
import { useTranslation } from '~/i18n/context'
import { requirePermission } from '~/server/auth/permissions.server'
import { requireAuth } from '~/server/auth/session.server'
import { db } from '~/server/db'
import { memberModel, roleModel, userModel } from '~/server/db/schemas/auth'
import { redirectWithFlash } from '~/server/flash.server'
import { updateMemberRoles } from '../../features/users/server/actions/update-role.action'
import { usersRepository } from '../../features/users/server/repository'
import type { Route } from './+types/$memberId.roles'

export async function loader({ request, params }: Route.LoaderArgs) {
  const session = await requireAuth(request)
  const url = new URL(request.url)
  const organizationId =
    url.searchParams.get('organizationId') ||
    session.session.activeOrganizationId

  if (!organizationId) {
    throw redirect('/users')
  }

  // Check permission
  await requirePermission(session.user.id, organizationId, 'user:update')

  const memberId = params.memberId

  // Get member details
  const [member] = await db
    .select({
      id: memberModel.id,
      userId: memberModel.userId,
      organizationId: memberModel.organizationId,
      userName: userModel.name,
      userEmail: userModel.email,
    })
    .from(memberModel)
    .innerJoin(userModel, eq(memberModel.userId, userModel.id))
    .where(eq(memberModel.id, memberId))
    .limit(1)

  if (!member) {
    throw redirect('/users')
  }

  // Get current roles for this member
  const memberRoles = await usersRepository.getMemberRoles(memberId)

  // Get all available roles for this organization
  const availableRoles = await db
    .select()
    .from(roleModel)
    .where(eq(roleModel.organizationId, organizationId))

  return {
    member,
    memberRoles,
    availableRoles,
    organizationId,
  }
}

export async function action({ request, params }: Route.ActionArgs) {
  const memberId = params.memberId
  const formData = await request.formData()
  const roleIds = formData.getAll('roleIds') as string[]

  const result = await updateMemberRoles(request, memberId, roleIds)

  const url = new URL(request.url)
  const returnUrl = `/users?organizationId=${url.searchParams.get('organizationId') || ''}`

  if (result.success) {
    return redirectWithFlash(returnUrl, {
      type: 'success',
      message: result.message,
    })
  }

  return { error: result.message }
}

export default function ManageMemberRoles({
  loaderData,
  actionData,
}: Route.ComponentProps) {
  const { member, memberRoles, availableRoles, organizationId } = loaderData
  const { t } = useTranslation()

  const memberRoleIds = memberRoles.map((r) => r.id)

  return (
    <div className='mx-auto max-w-2xl space-y-6'>
      <div className='flex items-center gap-4'>
        <Link
          to={`/users?organizationId=${organizationId}`}
          className='text-muted-foreground hover:text-foreground'
        >
          &larr; {t('common.back')}
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('users.manageRoles')} - {member.userName}</CardTitle>
          <CardDescription>
            Select the roles to assign to {member.userEmail}. The user will have
            combined permissions from all selected roles.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {actionData?.error && (
            <div className='bg-destructive/10 text-destructive mb-4 rounded-md p-3 text-sm'>
              {actionData.error}
            </div>
          )}

          <Form method='post'>
            <div className='space-y-3'>
              {availableRoles.map((role) => (
                <label
                  key={role.id}
                  className={`hover:bg-muted/50 flex cursor-pointer items-start gap-3 rounded-lg border p-4 ${
                    memberRoleIds.includes(role.id)
                      ? 'border-primary bg-primary/5'
                      : ''
                  }`}
                >
                  <input
                    type='checkbox'
                    name='roleIds'
                    value={role.id}
                    defaultChecked={memberRoleIds.includes(role.id)}
                    className='mt-1'
                  />
                  <div className='flex-1'>
                    <div className='flex items-center gap-2'>
                      <span className='font-medium'>{role.name}</span>
                      {role.isSystem && (
                        <span className='rounded bg-blue-100 px-2 py-0.5 text-xs text-blue-800'>
                          {t('common.system')}
                        </span>
                      )}
                    </div>
                    {role.description && (
                      <p className='text-muted-foreground text-sm'>
                        {role.description}
                      </p>
                    )}
                  </div>
                </label>
              ))}

              {availableRoles.length === 0 && (
                <div className='text-muted-foreground py-4 text-center'>
                  {t('roles.noRoles')}
                </div>
              )}
            </div>

            <div className='mt-6 flex gap-3'>
              <Link to={`/users?organizationId=${organizationId}`}>
                <Button type='button' variant='outline'>
                  {t('common.cancel')}
                </Button>
              </Link>
              <Button type='submit'>{t('common.save')}</Button>
            </div>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
