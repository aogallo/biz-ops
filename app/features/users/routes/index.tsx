import { eq } from 'drizzle-orm'
import { Link, useSearchParams } from 'react-router'
import { Button } from '~/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '~/components/ui/table'
import { useCanPerformAction } from '~/hooks/usePermissions'
import { useToastFromLoader } from '~/hooks/useToastFromLoader'
import { getUserOrganizations } from '~/server/auth/organization.server'
import { requireAuth } from '~/server/auth/session.server'
import { db } from '~/server/db'
import { roleModel } from '~/server/db/schemas/auth'
import { getFlash, redirectWithFlash } from '~/server/flash.server'
import { isSuperAdmin } from '~/server/permissions'
import { updateMemberRole } from '../server/actions/update-role.action'
import { usersRepository } from '../server/repository'
import type { Route } from './+types/index'

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
  const canInviteUser = useCanPerformAction('users.invite')
  const canUpdateUser = useCanPerformAction('users.invite') // Using user:create as proxy for user:update

  useToastFromLoader(toast)

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
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold'>User Management</h1>
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
            <Select
              value={selectedOrganizationId || ''}
              onValueChange={(id) => setSearchParams({ organizationId: id })}
            >
              <SelectTrigger className='w-75'>
                <SelectValue placeholder='Select organization' />
              </SelectTrigger>
              <SelectContent>
                {organizations.map((org) => (
                  <SelectItem
                    key={org.organization.id}
                    value={org.organization.id}
                  >
                    {org.organization.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <div className='text-muted-foreground py-8 text-center'>
              No users found in this organization
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Verified</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className='font-medium'>{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <div className='flex flex-wrap gap-1'>
                        {user.roles && user.roles.length > 0 ? (
                          user.roles.map((role) => (
                            <span
                              key={role.id}
                              className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${
                                role.isSystem
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-primary/10 text-primary'
                              }`}
                            >
                              {role.name}
                            </span>
                          ))
                        ) : (
                          <span className='bg-muted text-muted-foreground inline-flex items-center rounded-md px-2 py-1 text-xs font-medium'>
                            {user.memberRole}
                          </span>
                        )}
                      </div>
                      {canUpdateUser && (
                        <Link
                          to={`/users/${user.memberId}/roles?organizationId=${selectedOrganizationId}`}
                          className='text-primary mt-1 block text-xs hover:underline'
                        >
                          Manage roles
                        </Link>
                      )}
                    </TableCell>
                    <TableCell>
                      {user.emailVerified ? (
                        <span className='text-green-600'>✓ Verified</span>
                      ) : (
                        <span className='text-amber-600'>Pending</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {new Date(user.createdAt).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Invited By</TableHead>
                  <TableHead>Sent</TableHead>
                  <TableHead>Expires</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invitations.map((inv) => (
                  <TableRow key={inv.id}>
                    <TableCell className='font-medium'>{inv.email}</TableCell>
                    <TableCell>
                      <span className='inline-flex items-center rounded-md bg-amber-100 px-2 py-1 text-xs font-medium text-amber-800'>
                        {inv.role}
                      </span>
                    </TableCell>
                    <TableCell>{inv.inviterName || 'Unknown'}</TableCell>
                    <TableCell>
                      {new Date(inv.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {new Date(inv.expiresAt).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
