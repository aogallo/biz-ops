import type { ColumnDef } from '@tanstack/react-table'
import { eq } from 'drizzle-orm'
import { useMemo } from 'react'
import { Link, useSearchParams } from 'react-router'
import { useTranslation } from '~/i18n/context'
import { DataTable } from '~/components/dataTable/DataTable'
import { Button } from '~/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card'
import { Combobox } from '~/components/ui/combobox'
import { useCanPerformAction } from '~/hooks/usePermissions'
import { useToastFromLoader } from '~/hooks/useToastFromLoader'
import { getUserOrganizations } from '~/server/auth/organization.server'
import { requireAuth } from '~/server/auth/session.server'
import { db } from '~/server/db'
import { roleModel } from '~/server/db/schemas/auth'
import { getFlash, redirectWithFlash } from '~/server/flash.server'
import { isSuperAdmin } from '~/server/permissions'
import { updateMemberRole } from '../../features/users/server/actions/update-role.action'
import { usersRepository } from '../../features/users/server/repository'
import type { Route } from './+types/index'

type User = Awaited<
  ReturnType<typeof usersRepository.getAllByOrganizationWithRoles>
>[number]

type Invitation = Awaited<
  ReturnType<typeof usersRepository.getPendingInvitations>
>[number]

export async function loader({ request }: Route.LoaderArgs) {
  const session = await requireAuth(request)
  const url = new URL(request.url)
  const organizationId = url.searchParams.get('organizationId')

  // Get flash message
  const { flash } = getFlash(request)

  // Fetch all needed data in parallel
  const [isSuperAdminUser, organizations] = await Promise.all([
    isSuperAdmin(session.user.id),
    getUserOrganizations(session.user.id),
  ])

  // Default to first org if none selected
  const selectedOrgId = organizationId || organizations[0]?.organization.id

  // Fetch users, invitations, and available roles for selected organization
  const [users, invitations, availableRoles] = await Promise.all([
    usersRepository.getAllByOrganizationWithRoles(selectedOrgId),
    usersRepository.getPendingInvitations(selectedOrgId),
    db
      .select()
      .from(roleModel)
      .where(eq(roleModel.organizationId, selectedOrgId)),
  ])

  return {
    isSuperAdmin: isSuperAdminUser,
    organizations,
    users,
    invitations,
    availableRoles,
    selectedOrganizationId: selectedOrgId,
    user: session.user,
    toast: flash,
  }
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData()
  const memberId = formData.get('memberId') as string
  const roleId = formData.get('roleId') as string

  const result = await updateMemberRole(request, memberId, roleId)

  if (result.success) {
    return redirectWithFlash(request.url, {
      type: 'success',
      message: result.message,
    })
  }

  return redirectWithFlash(request.url, {
    type: 'error',
    message: result.message,
  })
}

export default function UsersPage({ loaderData }: Route.ComponentProps) {
  const {
    isSuperAdmin,
    organizations,
    users,
    invitations,
    selectedOrganizationId,
    toast,
  } = loaderData
  const [, setSearchParams] = useSearchParams()
  const { t } = useTranslation()
  const canInviteUser = useCanPerformAction('users.invite')
  const canUpdateUser = useCanPerformAction('users.invite')

  useToastFromLoader(toast)

  const userColumns = useMemo<ColumnDef<User>[]>(
    () => [
      {
        accessorKey: 'name',
        header: t('common.name'),
        cell: ({ row }) => (
          <span className='font-medium'>{row.getValue('name')}</span>
        ),
      },
      {
        accessorKey: 'email',
        header: t('common.email'),
      },
      {
        accessorKey: 'roles',
        header: t('users.manageRoles'),
        cell: ({ row }) => {
          const roles = row.original.roles
          const memberRole = row.original.memberRole
          return (
            <div>
              <div className='flex flex-wrap gap-1'>
                {roles && roles.length > 0 ? (
                  roles.map((role) => (
                    <span
                      key={role.id}
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        role.isSystem
                          ? 'status-info'
                          : 'bg-primary/10 text-primary dark:bg-primary/20'
                      }`}
                    >
                      {role.name}
                    </span>
                  ))
                ) : (
                  <span className='status-muted inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium'>
                    {memberRole}
                  </span>
                )}
              </div>
              {canUpdateUser && (
                <Link
                  to={`/users/${row.original.memberId}/roles?organizationId=${selectedOrganizationId}`}
                  className='text-primary mt-1 block text-xs hover:underline'
                >
                  {t('users.manageRoles')}
                </Link>
              )}
            </div>
          )
        },
      },
      {
        accessorKey: 'emailVerified',
        header: t('users.emailVerified'),
        cell: ({ row }) => {
          const verified = row.getValue('emailVerified') as boolean
          return verified ? (
            <span className='status-success inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium'>
              {t('users.verified')}
            </span>
          ) : (
            <span className='status-warning inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium'>
              {t('users.pending')}
            </span>
          )
        },
      },
      {
        accessorKey: 'createdAt',
        header: t('common.created'),
        cell: ({ row }) => {
          const date = row.getValue('createdAt') as Date
          return <div>{new Date(date).toLocaleDateString()}</div>
        },
      },
    ],
    [canUpdateUser, selectedOrganizationId]
  )

  const invitationColumns = useMemo<ColumnDef<Invitation>[]>(
    () => [
      {
        accessorKey: 'email',
        header: 'Email',
        cell: ({ row }) => (
          <span className='font-medium'>{row.getValue('email')}</span>
        ),
      },
      {
        accessorKey: 'role',
        header: 'Role',
        cell: ({ row }) => (
          <span className='status-warning inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium'>
            {row.getValue('role')}
          </span>
        ),
      },
      {
        accessorKey: 'inviterName',
        header: 'Invited By',
        cell: ({ row }) => (
          <span>{row.getValue('inviterName') || 'Unknown'}</span>
        ),
      },
      {
        accessorKey: 'createdAt',
        header: 'Sent',
        cell: ({ row }) => {
          const date = row.getValue('createdAt') as Date
          return <div>{new Date(date).toLocaleDateString()}</div>
        },
      },
      {
        accessorKey: 'expiresAt',
        header: 'Expires',
        cell: ({ row }) => {
          const date = row.getValue('expiresAt') as Date
          return <div>{new Date(date).toLocaleDateString()}</div>
        },
      },
    ],
    []
  )

  // Show message if no organizations
  if (organizations.length === 0) {
    return (
      <div className='container mx-auto py-6'>
        <div className='py-12 text-center'>
          <h2 className='mb-4 text-2xl font-bold'>No Organizations Found</h2>
          <p className='text-muted-foreground mb-6'>
            You need to be a member of at least one organization to manage
            users.
          </p>
          {isSuperAdmin && (
            <Link to='/admin/organizations/create'>
              <Button>Create Organization</Button>
            </Link>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className='section-gap'>
      {/* Page Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-page-title'>User Management</h1>
          <p className='text-muted-foreground'>
            {isSuperAdmin
              ? 'Manage users across all organizations'
              : 'Manage users in your organization'}
          </p>
        </div>
        {canInviteUser && (
          <Link to='/users/invite'>
            <Button>Invite User</Button>
          </Link>
        )}
      </div>

      {/* Active Users Section */}
      <Card>
        <CardHeader>
          <div className='flex items-center justify-between'>
            <div>
              <CardTitle>Active Users</CardTitle>
              <CardDescription>View and manage user accounts</CardDescription>
            </div>
            <Combobox
              value={selectedOrganizationId || ''}
              onValueChange={(id) => setSearchParams({ organizationId: id })}
              options={organizations.map((org) => ({
                value: org.organization.id,
                label: org.organization.name,
              }))}
              placeholder='Select organization'
              searchPlaceholder='Search organizations...'
              emptyMessage='No organizations found.'
              className='w-75'
            />
          </div>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <div className='text-muted-foreground py-8 text-center'>
              No users found in this organization
            </div>
          ) : (
            <DataTable
              columns={userColumns}
              data={users}
              enableSearch
              searchPlaceholder='Search users...'
            />
          )}
        </CardContent>
      </Card>

      {/* Pending Invitations Section */}
      {invitations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Pending Invitations</CardTitle>
            <CardDescription>
              Users who have been invited but haven&apos;t accepted yet
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={invitationColumns}
              data={invitations}
              enableSearch
              searchPlaceholder='Search invitations...'
            />
          </CardContent>
        </Card>
      )}
    </div>
  )
}
