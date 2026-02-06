import { Building2, Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useFetcher } from 'react-router'
import { Label } from '~/components/ui/label'
import { Combobox } from '~/components/ui/combobox'
import { useInvitationWizard } from '../hooks/useInvitationWizard'
import type { OrganizationData, PermissionData, RoleData } from '../types'
import { PermissionsStep } from './steps/PermissionsStep'
import { ReviewStep } from './steps/ReviewStep'
import { RoleAssignmentStep } from './steps/RoleAssignmentStep'
import { UserInformationStep } from './steps/UserInformationStep'

interface InvitationWizardProps {
  organizations: OrganizationData[]
  isSuperAdmin: boolean
  defaultOrganizationId: string | null
  initialRoles: RoleData[]
  permissions: PermissionData[]
  onSubmit: (data: {
    organizationId: string
    email: string
    name: string
    roleIds: string[]
    createNewRole: boolean
    newRoleName: string
    newRoleDescription: string
    selectedPermissions: string[]
    customPermissions: Array<{ resource: string; action: string }>
  }) => Promise<void>
}

export function InvitationWizard({
  organizations,
  isSuperAdmin,
  defaultOrganizationId,
  initialRoles,
  permissions,
  onSubmit,
}: InvitationWizardProps) {
  const {
    state,
    updateField,
    nextStep,
    previousStep,
    goToStep,
    togglePermission,
    toggleRole,
    selectAllPermissionsForResource,
    addCustomPermission,
    removeCustomPermission,
    setOrganization,
  } = useInvitationWizard()

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [roles, setRoles] = useState<RoleData[]>(initialRoles)
  const rolesFetcher = useFetcher<{ roles: RoleData[] }>()

  // Initialize organization on mount
  useEffect(() => {
    if (defaultOrganizationId && !state.organizationId) {
      updateField('organizationId', defaultOrganizationId)
    }
  }, [defaultOrganizationId, state.organizationId, updateField])

  // Update roles when fetcher returns data
  useEffect(() => {
    if (rolesFetcher.data?.roles) {
      setRoles(rolesFetcher.data.roles)
    }
  }, [rolesFetcher.data])

  const handleOrganizationChange = (organizationId: string) => {
    setOrganization(organizationId)
    // Fetch roles for the new organization
    rolesFetcher.load(`/invitations/roles?organizationId=${organizationId}`)
  }

  const selectedOrganization = organizations.find(
    (org) => org.id === (state.organizationId || defaultOrganizationId)
  )

  const isLoadingRoles = rolesFetcher.state === 'loading'

  const handleSubmit = async () => {
    const organizationId = state.organizationId || defaultOrganizationId
    if (!organizationId) {
      return
    }

    setIsSubmitting(true)
    try {
      await onSubmit({
        organizationId,
        email: state.email,
        name: state.name,
        roleIds: state.roleIds,
        createNewRole: state.createNewRole,
        newRoleName: state.newRoleName,
        newRoleDescription: state.newRoleDescription,
        selectedPermissions: state.selectedPermissions,
        customPermissions: state.customPermissions,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className='mx-auto max-w-3xl'>
      {/* Organization Selector */}
      <div className='bg-card mb-6 rounded-lg border p-4'>
        <div className='mb-2 flex items-center gap-2'>
          <Building2 className='text-muted-foreground h-4 w-4' />
          <Label htmlFor='organization-select' className='text-sm font-medium'>
            Organization
          </Label>
        </div>
        {isSuperAdmin ? (
          <Combobox
            value={state.organizationId || defaultOrganizationId || ''}
            onValueChange={handleOrganizationChange}
            disabled={isLoadingRoles}
            options={organizations.map((org) => ({
              value: org.id,
              label: org.name,
            }))}
            placeholder='Select organization'
            searchPlaceholder='Search organizations...'
            emptyMessage='No organizations found.'
          />
        ) : (
          <div>
            <div className='bg-muted/50 flex items-center gap-2 rounded-md border px-3 py-2 text-sm'>
              <span className='font-medium'>{selectedOrganization?.name}</span>
            </div>
            <p className='text-muted-foreground mt-1 text-xs'>
              You can only invite users to your active organization
            </p>
          </div>
        )}
        {isLoadingRoles && (
          <div className='text-muted-foreground mt-2 flex items-center gap-2 text-xs'>
            <Loader2 className='h-3 w-3 animate-spin' />
            Loading roles...
          </div>
        )}
      </div>

      {/* Progress Indicator */}
      <div className='mb-8'>
        <div className='flex items-center justify-between'>
          {[1, 2, 3, 4].map((step) => (
            <div key={step} className='flex flex-1 items-center'>
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full border-2 ${
                  state.currentStep === step
                    ? 'border-primary bg-primary text-primary-foreground'
                    : state.currentStep > step
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-muted-foreground/30 text-muted-foreground'
                }`}
              >
                {state.currentStep > step ? (
                  <svg
                    className='h-5 w-5'
                    fill='none'
                    viewBox='0 0 24 24'
                    stroke='currentColor'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M5 13l4 4L19 7'
                    />
                  </svg>
                ) : (
                  <span className='text-sm font-medium'>{step}</span>
                )}
              </div>
              {step < 4 && (
                <div
                  className={`mx-2 h-0.5 flex-1 ${
                    state.currentStep > step
                      ? 'bg-primary'
                      : 'bg-muted-foreground/30'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
        <div className='text-muted-foreground mt-2 flex justify-between text-xs'>
          <span>User Info</span>
          <span>Role</span>
          <span>Permissions</span>
          <span>Review</span>
        </div>
      </div>

      {/* Step Content */}
      <div className='bg-card rounded-lg border p-6'>
        {state.currentStep === 1 && (
          <UserInformationStep
            state={state}
            roles={roles}
            updateField={updateField}
            nextStep={nextStep}
          />
        )}

        {state.currentStep === 2 && (
          <RoleAssignmentStep
            state={state}
            roles={roles}
            updateField={updateField}
            toggleRole={toggleRole}
            nextStep={nextStep}
            previousStep={previousStep}
          />
        )}

        {state.currentStep === 3 && (
          <PermissionsStep
            state={state}
            permissions={permissions}
            togglePermission={togglePermission}
            selectAllPermissionsForResource={selectAllPermissionsForResource}
            addCustomPermission={addCustomPermission}
            removeCustomPermission={removeCustomPermission}
            nextStep={nextStep}
            previousStep={previousStep}
          />
        )}

        {state.currentStep === 4 && (
          <ReviewStep
            state={state}
            roles={roles}
            permissions={permissions}
            organizationName={selectedOrganization?.name || ''}
            previousStep={previousStep}
            goToStep={goToStep}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
          />
        )}
      </div>
    </div>
  )
}
