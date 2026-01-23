import type { PermissionData, RoleData, WizardState } from '../../types'

interface ReviewStepProps {
  state: WizardState
  roles: RoleData[]
  permissions: PermissionData[]
  organizationName: string
  previousStep: () => void
  goToStep: (step: 1 | 2 | 3 | 4) => void
  onSubmit: () => void
  isSubmitting: boolean
}

export function ReviewStep({
  state,
  roles,
  permissions,
  organizationName,
  previousStep,
  goToStep,
  onSubmit,
  isSubmitting,
}: ReviewStepProps) {
  // Get all selected roles (many-to-many)
  const selectedRoles = roles.filter((r) => state.roleIds.includes(r.id))
  const displayRoles = selectedRoles

  const selectedPerms = permissions.filter((p) =>
    state.selectedPermissions.includes(p.id)
  )

  // Group selected permissions by resource
  const groupedPerms = selectedPerms.reduce(
    (acc, perm) => {
      if (!acc[perm.resource]) {
        acc[perm.resource] = []
      }
      acc[perm.resource].push(perm.action)
      return acc
    },
    {} as Record<string, string[]>
  )

  return (
    <div className='space-y-6'>
      <div>
        <h2 className='text-xl font-semibold'>Review Invitation</h2>
        <p className='text-muted-foreground text-sm'>
          Review the details before sending the invitation
        </p>
      </div>

      <div className='divide-y rounded-lg border'>
        {/* Organization */}
        <div className='p-4'>
          <div className='mb-2 flex items-center justify-between'>
            <h3 className='font-medium'>Organization</h3>
          </div>
          <div className='text-sm'>
            <span className='font-medium'>{organizationName}</span>
          </div>
        </div>

        {/* User Info */}
        <div className='p-4'>
          <div className='mb-2 flex items-center justify-between'>
            <h3 className='font-medium'>User Information</h3>
            <button
              type='button'
              onClick={() => goToStep(1)}
              className='text-primary text-sm hover:underline'
            >
              Edit
            </button>
          </div>
          <div className='space-y-1 text-sm'>
            <div>
              <span className='text-muted-foreground'>Name:</span>{' '}
              <span className='font-medium'>{state.name}</span>
            </div>
            <div>
              <span className='text-muted-foreground'>Email:</span>{' '}
              <span className='font-medium'>{state.email}</span>
            </div>
          </div>
        </div>

        {/* Roles */}
        <div className='p-4'>
          <div className='mb-2 flex items-center justify-between'>
            <h3 className='font-medium'>Role Assignment</h3>
            <button
              type='button'
              onClick={() => goToStep(2)}
              className='text-primary text-sm hover:underline'
            >
              Edit
            </button>
          </div>
          <div className='space-y-2 text-sm'>
            {/* Display selected roles */}
            {displayRoles.length > 0 && (
              <div className='space-y-2'>
                {displayRoles.map((role) => (
                  <div key={role.id} className='flex items-start gap-2'>
                    <div className='flex-1'>
                      <div className='font-medium'>{role.name}</div>
                      {role.description && (
                        <div className='text-muted-foreground text-xs'>
                          {role.description}
                        </div>
                      )}
                    </div>
                    {role.isSystem && (
                      <span className='inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-800'>
                        System
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Display custom role if being created */}
            {state.createNewRole && (
              <div className='border-t pt-2'>
                <div className='flex items-start gap-2'>
                  <div className='flex-1'>
                    <div className='font-medium'>{state.newRoleName}</div>
                    {state.newRoleDescription && (
                      <div className='text-muted-foreground text-xs'>
                        {state.newRoleDescription}
                      </div>
                    )}
                  </div>
                  <span className='inline-flex items-center rounded-full bg-purple-100 px-2 py-0.5 text-xs text-purple-800'>
                    New
                  </span>
                </div>
              </div>
            )}

            {displayRoles.length === 0 && !state.createNewRole && (
              <div className='text-muted-foreground'>No roles selected</div>
            )}

            {displayRoles.length > 0 && (
              <div className='text-muted-foreground mt-1 text-xs'>
                {displayRoles.length} role(s) selected
                {state.createNewRole && ' + 1 new role'}
              </div>
            )}
          </div>
        </div>

        {/* Permissions */}
        <div className='p-4'>
          <div className='mb-2 flex items-center justify-between'>
            <h3 className='font-medium'>Permissions</h3>
            <button
              type='button'
              onClick={() => goToStep(3)}
              className='text-primary text-sm hover:underline'
            >
              Edit
            </button>
          </div>
          <div className='space-y-3 text-sm'>
            {Object.keys(groupedPerms).length > 0 && (
              <div>
                <div className='text-muted-foreground mb-1'>
                  Standard ({selectedPerms.length}):
                </div>
                <div className='space-y-2'>
                  {Object.entries(groupedPerms).map(([resource, actions]) => (
                    <div key={resource}>
                      <div className='font-medium capitalize'>{resource}:</div>
                      <div className='flex flex-wrap gap-1'>
                        {actions.map((action) => (
                          <span
                            key={action}
                            className='bg-muted inline-flex items-center rounded px-2 py-0.5 text-xs'
                          >
                            {action}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {state.customPermissions.length > 0 && (
              <div>
                <div className='text-muted-foreground mb-1'>
                  Custom ({state.customPermissions.length}):
                </div>
                <div className='flex flex-wrap gap-1'>
                  {state.customPermissions.map((cp, i) => (
                    <span
                      key={i}
                      className='bg-primary/10 inline-flex items-center rounded px-2 py-0.5 text-xs'
                    >
                      {cp.resource}:{cp.action}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {selectedPerms.length === 0 &&
              state.customPermissions.length === 0 && (
                <div className='text-muted-foreground'>
                  No permissions selected
                </div>
              )}
          </div>
        </div>
      </div>

      {/* Note */}
      <div className='rounded-lg bg-blue-50 p-4 text-sm'>
        <p>
          An invitation email will be sent to <strong>{state.email}</strong> to
          join <strong>{organizationName}</strong> after you click &quot;Send
          Invitation&quot;.
        </p>
      </div>

      <div className='flex gap-3'>
        <button
          type='button'
          onClick={previousStep}
          disabled={isSubmitting}
          className='border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-md border px-4 py-2 text-sm font-medium disabled:opacity-50'
        >
          Back
        </button>
        <button
          type='button'
          onClick={onSubmit}
          disabled={isSubmitting}
          className='bg-primary text-primary-foreground hover:bg-primary/90 flex-1 rounded-md px-4 py-2 text-sm font-medium disabled:opacity-50'
        >
          {isSubmitting ? 'Sending...' : 'Send Invitation'}
        </button>
      </div>
    </div>
  )
}
