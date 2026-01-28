import { useEffect, useMemo, useState } from 'react'
import { redirect, useFetcher, useSearchParams } from 'react-router'
import { toast } from 'sonner'
import { Combobox } from '~/components/ui/combobox'
import { UserListPanel } from '~/features/roles/components/user-list-panel'
import { RoleAssignmentPanel } from '~/features/roles/components/role-assignment-panel'
import { rolesRepository } from '~/features/roles/server/repository'
import { updateMemberRoles } from '~/features/users/server/actions/update-role.action'
import { usersRepository } from '~/features/users/server/repository'
import { getUserOrganizations } from '~/server/auth/organization.server'
import { requirePermission } from '~/server/auth/permissions.server'
import { requireAuth } from '~/server/auth/session.server'
import type { Route } from './+types/assign'

export async function loader({ request }: Route.LoaderArgs) {
  const session = await requireAuth(request)
  const url = new URL(request.url)

  // Handle fetcher requests for user roles (resource route pattern)
  const intent = url.searchParams.get('intent')
  if (intent === 'getUserRoles') {
    const memberId = url.searchParams.get('memberId')
    if (memberId) {
      const userRoles = await usersRepository.getMemberRoles(memberId)
      return { userRoles }
    }
    return { userRoles: [] }
  }

  // Get URL parameters - only organizationId is in URL now
  const organizationId = url.searchParams.get('organizationId') || session.session.activeOrganizationId

  // Get organizations the user can access
  const organizations = await getUserOrganizations(session.user.id)

  if (!organizationId && organizations.length === 0) {
    throw redirect('/organization')
  }

  const activeOrgId = organizationId || organizations[0]?.organization.id

  if (!activeOrgId) {
    throw redirect('/organization')
  }

  // Check permission (skip for super admins)
  if (!session.user.isSuperAdmin) {
    await requirePermission(session.user.id, activeOrgId, 'role:assign')
  }

  // Fetch users with roles for the selected organization (all users, no server-side filtering)
  const users = await usersRepository.getAllByOrganizationWithRoles(activeOrgId)

  // Fetch available roles for the organization
  const availableRoles = await rolesRepository.getAllByOrganization(activeOrgId)

  return {
    organizations,
    users,
    availableRoles,
    selectedOrgId: activeOrgId,
  }
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData()
  const memberId = formData.get('memberId') as string
  const organizationId = formData.get('organizationId') as string
  const roleIds = formData.getAll('roleIds') as string[]

  if (!memberId || !organizationId) {
    return { success: false, error: 'Missing required fields' }
  }

  const result = await updateMemberRoles(request, memberId, roleIds)

  if (result.success) {
    // Return JSON for fetcher - no redirect
    return { success: true, message: result.message }
  }

  return { success: false, error: result.message }
}

export default function RoleAssignmentPage({ loaderData }: Route.ComponentProps) {
  // Handle resource route responses (when intent=getUserRoles)
  if ('userRoles' in loaderData) {
    return null // This shouldn't render, fetcher handles it
  }

  const { organizations = [], users = [], availableRoles = [], selectedOrgId = '' } = loaderData

  const [, setSearchParams] = useSearchParams()

  // Local state for selected user (no longer in URL)
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null)

  // Fetcher for loading user roles
  const rolesFetcher = useFetcher<{ userRoles: Array<{ id: string; name: string; description: string | null; isSystem: boolean }> }>()

  // Fetcher for saving roles
  const saveFetcher = useFetcher<{ success: boolean; message?: string; error?: string }>()

  // Load user roles when selection changes
  useEffect(() => {
    if (selectedMemberId) {
      rolesFetcher.load(`/roles/assign?intent=getUserRoles&memberId=${selectedMemberId}`)
    }
  }, [selectedMemberId])

  // Show toast when save completes
  useEffect(() => {
    if (saveFetcher.state === 'idle' && saveFetcher.data) {
      if (saveFetcher.data.success) {
        toast.success(saveFetcher.data.message || 'Roles updated successfully')
        // Reload the user's roles to get fresh data
        if (selectedMemberId) {
          rolesFetcher.load(`/roles/assign?intent=getUserRoles&memberId=${selectedMemberId}`)
        }
      } else if (saveFetcher.data.error) {
        toast.error(saveFetcher.data.error)
      }
    }
  }, [saveFetcher.state, saveFetcher.data])

  // Client-side filtered users
  const [searchQuery, setSearchQuery] = useState('')
  const filteredUsers = useMemo(() => {
    if (!searchQuery) return users
    const q = searchQuery.toLowerCase()
    return users.filter(
      (u) => u.name?.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
    )
  }, [users, searchQuery])

  // Get selected user from list
  const selectedUser = users.find((u) => u.memberId === selectedMemberId) || null

  // User roles from fetcher or empty
  const userRoles = rolesFetcher.data?.userRoles ?? []

  // Loading states
  const isLoadingRoles = rolesFetcher.state === 'loading'
  const isSubmitting = saveFetcher.state === 'submitting'

  const handleOrganizationChange = (orgId: string) => {
    // Reset selection when changing org
    setSelectedMemberId(null)
    setSearchQuery('')
    setSearchParams({ organizationId: orgId })
  }

  const handleSelectUser = (memberId: string) => {
    setSelectedMemberId(memberId)
  }

  const handleSaveRoles = (roleIds: string[]) => {
    if (!selectedMemberId || !selectedOrgId) return

    const formData = new FormData()
    formData.append('memberId', selectedMemberId)
    formData.append('organizationId', selectedOrgId)
    for (const roleId of roleIds) {
      formData.append('roleIds', roleId)
    }

    saveFetcher.submit(formData, { method: 'post' })
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
          <Combobox
            value={selectedOrgId}
            onValueChange={handleOrganizationChange}
            options={organizations.map((org) => ({
              value: org.organization.id,
              label: org.organization.name,
            }))}
            placeholder='Select organization'
            searchPlaceholder='Search organizations...'
            emptyMessage='No organizations found.'
            className='w-64'
          />
        )}
      </div>

      <div className='grid gap-6 lg:grid-cols-12'>
        {/* Left Panel - User List */}
        <div className='lg:col-span-5'>
          <UserListPanel
            users={filteredUsers}
            allUsersCount={users.length}
            selectedMemberId={selectedMemberId}
            onSelectUser={handleSelectUser}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />
        </div>

        {/* Right Panel - Role Assignment */}
        <div className='lg:col-span-7'>
          <RoleAssignmentPanel
            user={selectedUser}
            userRoles={userRoles}
            availableRoles={availableRoles}
            isLoading={isLoadingRoles}
            isSubmitting={isSubmitting}
            error={saveFetcher.data?.error}
            onSave={handleSaveRoles}
          />
        </div>
      </div>
    </div>
  )
}
