import { redirect, useNavigation, useSearchParams } from 'react-router'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'
import { UserListPanel } from '~/features/roles/components/user-list-panel'
import { RoleAssignmentPanel } from '~/features/roles/components/role-assignment-panel'
import { rolesRepository } from '~/features/roles/server/repository'
import { updateMemberRoles } from '~/features/users/server/actions/update-role.action'
import { usersRepository } from '~/features/users/server/repository'
import { useToastFromLoader } from '~/hooks/useToastFromLoader'
import { getUserOrganizations } from '~/server/auth/organization.server'
import { requirePermission } from '~/server/auth/permissions.server'
import { requireAuth } from '~/server/auth/session.server'
import { getFlash, redirectWithFlash } from '~/server/flash.server'
import type { Route } from './+types/assign'

export async function loader({ request }: Route.LoaderArgs) {
  const session = await requireAuth(request)
  const url = new URL(request.url)

  // Get flash message
  const { flash } = getFlash(request)

  // Get URL parameters
  const organizationId = url.searchParams.get('organizationId') || session.session.activeOrganizationId
  const selectedMemberId = url.searchParams.get('selectedUserId')
  const search = url.searchParams.get('search') || ''

  // Get organizations the user can access
  const organizations = await getUserOrganizations(session.user.id)

  if (!organizationId && organizations.length === 0) {
    throw redirect('/organization')
  }

  const activeOrgId = organizationId || organizations[0]?.organization.id

  if (!activeOrgId) {
    throw redirect('/organization')
  }

  // Check permission
  await requirePermission(session.user.id, activeOrgId, 'user:update')

  // Fetch users with roles for the selected organization
  let users = await usersRepository.getAllByOrganizationWithRoles(activeOrgId)

  // Filter users by search query
  if (search) {
    const searchLower = search.toLowerCase()
    users = users.filter(
      (user) =>
        user.name?.toLowerCase().includes(searchLower) ||
        user.email.toLowerCase().includes(searchLower)
    )
  }

  // Fetch available roles for the organization
  const availableRoles = await rolesRepository.getAllByOrganization(activeOrgId)

  // Get selected user's current roles if a user is selected
  let selectedUser = null
  let selectedUserRoles: Array<{ id: string; name: string; description: string | null; isSystem: boolean }> = []

  if (selectedMemberId) {
    selectedUser = users.find((u) => u.memberId === selectedMemberId) || null
    if (selectedUser) {
      selectedUserRoles = await usersRepository.getMemberRoles(selectedMemberId)
    }
  }

  return {
    organizations,
    users,
    availableRoles,
    selectedOrgId: activeOrgId,
    selectedMemberId,
    selectedUser,
    selectedUserRoles,
    search,
    flash,
  }
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData()
  const memberId = formData.get('memberId') as string
  const organizationId = formData.get('organizationId') as string
  const roleIds = formData.getAll('roleIds') as string[]

  if (!memberId || !organizationId) {
    return { error: 'Missing required fields' }
  }

  const result = await updateMemberRoles(request, memberId, roleIds)

  const returnUrl = `/roles/assign?organizationId=${organizationId}&selectedUserId=${memberId}`

  if (result.success) {
    return redirectWithFlash(returnUrl, {
      type: 'success',
      message: result.message,
    })
  }

  return { error: result.message }
}

export default function RoleAssignmentPage({ loaderData, actionData }: Route.ComponentProps) {
  const {
    organizations,
    users,
    availableRoles,
    selectedOrgId,
    selectedMemberId,
    selectedUser,
    selectedUserRoles,
    search,
    flash,
  } = loaderData

  const [searchParams, setSearchParams] = useSearchParams()
  const navigation = useNavigation()
  const isSubmitting = navigation.state === 'submitting'

  // Show toast for flash messages
  useToastFromLoader(flash)

  const handleOrganizationChange = (orgId: string) => {
    setSearchParams({ organizationId: orgId })
  }

  const handleSelectUser = (memberId: string) => {
    const params = new URLSearchParams(searchParams)
    params.set('selectedUserId', memberId)
    setSearchParams(params)
  }

  const handleSearch = (query: string) => {
    const params = new URLSearchParams(searchParams)
    if (query) {
      params.set('search', query)
    } else {
      params.delete('search')
    }
    // Reset selected user when searching
    params.delete('selectedUserId')
    setSearchParams(params)
  }

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-semibold'>Role Assignment</h1>
          <p className='text-muted-foreground text-sm'>
            Assign roles to users in your organization
          </p>
        </div>

        {organizations.length > 1 && (
          <Select value={selectedOrgId} onValueChange={handleOrganizationChange}>
            <SelectTrigger className='w-64'>
              <SelectValue placeholder='Select organization' />
            </SelectTrigger>
            <SelectContent>
              {organizations.map((org) => (
                <SelectItem key={org.organization.id} value={org.organization.id}>
                  {org.organization.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      <div className='grid gap-6 lg:grid-cols-12'>
        {/* Left Panel - User List */}
        <div className='lg:col-span-5'>
          <UserListPanel
            users={users}
            selectedMemberId={selectedMemberId}
            onSelectUser={handleSelectUser}
            searchQuery={search}
            onSearch={handleSearch}
          />
        </div>

        {/* Right Panel - Role Assignment */}
        <div className='lg:col-span-7'>
          <RoleAssignmentPanel
            user={selectedUser}
            userRoles={selectedUserRoles}
            availableRoles={availableRoles}
            organizationId={selectedOrgId}
            isSubmitting={isSubmitting}
            error={actionData?.error}
          />
        </div>
      </div>
    </div>
  )
}
