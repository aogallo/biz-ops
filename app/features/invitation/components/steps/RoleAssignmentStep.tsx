import type { WizardState, RoleData } from '../../types'

interface RoleAssignmentStepProps {
  state: WizardState
  roles: RoleData[]
  updateField: <K extends keyof WizardState>(
    field: K,
    value: WizardState[K]
  ) => void
  toggleRole: (roleId: string) => void
  nextStep: () => void
  previousStep: () => void
}

export function RoleAssignmentStep({
  state,
  roles,
  updateField,
  toggleRole,
  nextStep,
  previousStep,
}: RoleAssignmentStepProps) {
  return (
    <div className='space-y-6'>
      <div>
        <h2 className='text-xl font-semibold'>Role Assignment</h2>
        <p className='text-muted-foreground text-sm'>
          Assign one or more roles to this user
        </p>
      </div>

      {/* Existing Roles - Checkboxes for multi-select */}
      <div>
        <label className='mb-3 block text-sm font-medium'>Select Roles</label>
        <p className='text-muted-foreground mb-3 text-xs'>
          You can select multiple roles. The user will have combined permissions
          from all selected roles.
        </p>
        <div className='space-y-3'>
          {roles.map((role) => (
            <label
              key={role.id}
              className={`hover:bg-muted/50 flex cursor-pointer items-start gap-3 rounded-lg border p-4 ${
                state.roleIds.includes(role.id)
                  ? 'border-primary bg-primary/5'
                  : ''
              }`}
            >
              <input
                type='checkbox'
                checked={state.roleIds.includes(role.id)}
                onChange={() => {
                  toggleRole(role.id)
                  // Disable createNewRole when selecting existing roles
                  if (state.createNewRole) {
                    updateField('createNewRole', false)
                  }
                }}
                className='mt-1'
              />
              <div className='flex-1'>
                <div className='flex items-center gap-2'>
                  <div className='font-medium'>{role.name}</div>
                  {role.isSystem && (
                    <span className='rounded bg-blue-100 px-2 py-0.5 text-xs text-blue-800'>
                      System
                    </span>
                  )}
                </div>
                {role.description && (
                  <div className='text-muted-foreground text-sm'>
                    {role.description}
                  </div>
                )}
              </div>
            </label>
          ))}
        </div>
        {state.errors.role && (
          <p className='text-destructive mt-2 text-sm'>{state.errors.role}</p>
        )}
        {state.errors.roleId && (
          <p className='text-destructive mt-2 text-sm'>{state.errors.roleId}</p>
        )}
        {state.roleIds.length > 0 && (
          <p className='text-muted-foreground mt-2 text-sm'>
            {state.roleIds.length} role(s) selected
          </p>
        )}
      </div>

      {/* Create Custom Role */}
      <div className='border-t pt-6'>
        <label className='flex cursor-pointer items-center gap-3'>
          <input
            type='checkbox'
            checked={state.createNewRole}
            onChange={() => {
              updateField('createNewRole', !state.createNewRole)
            }}
          />
          <span className='font-medium'>Also create a custom role</span>
        </label>
        <p className='text-muted-foreground ml-7 text-xs'>
          Create an additional custom role for this user
        </p>

        {state.createNewRole && (
          <div className='mt-4 ml-7 space-y-4'>
            <div>
              <label
                htmlFor='roleName'
                className='mb-2 block text-sm font-medium'
              >
                Role Name
              </label>
              <input
                type='text'
                id='roleName'
                value={state.newRoleName}
                onChange={(e) => updateField('newRoleName', e.target.value)}
                placeholder='e.g., Sales Manager'
                className='border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:outline-none'
              />
              {state.errors.newRoleName && (
                <p className='text-destructive mt-1 text-sm'>
                  {state.errors.newRoleName}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor='roleDescription'
                className='mb-2 block text-sm font-medium'
              >
                Description (Optional)
              </label>
              <textarea
                id='roleDescription'
                value={state.newRoleDescription}
                onChange={(e) =>
                  updateField('newRoleDescription', e.target.value)
                }
                placeholder='What does this role do?'
                className='border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:outline-none'
                rows={3}
              />
            </div>
          </div>
        )}
      </div>

      <div className='flex gap-3'>
        <button
          type='button'
          onClick={previousStep}
          className='border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-md border px-4 py-2 text-sm font-medium'
        >
          Back
        </button>
        <button
          type='button'
          onClick={nextStep}
          className='bg-primary text-primary-foreground hover:bg-primary/90 flex-1 rounded-md px-4 py-2 text-sm font-medium'
        >
          Continue to Permissions
        </button>
      </div>
    </div>
  )
}
