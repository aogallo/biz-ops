import { useState, useMemo } from 'react'
import type { WizardState, PermissionData, CustomPermission } from '../../types'

interface PermissionsStepProps {
  state: WizardState
  permissions: PermissionData[]
  togglePermission: (permissionId: string) => void
  selectAllPermissionsForResource: (
    permissionIds: string[],
    selected: boolean
  ) => void
  addCustomPermission: (permission: CustomPermission) => void
  removeCustomPermission: (index: number) => void
  nextStep: () => void
  previousStep: () => void
}

export function PermissionsStep({
  state,
  permissions,
  togglePermission,
  selectAllPermissionsForResource,
  addCustomPermission,
  removeCustomPermission,
  nextStep,
  previousStep,
}: PermissionsStepProps) {
  const [customResource, setCustomResource] = useState('')
  const [customAction, setCustomAction] = useState('')

  // Group permissions by resource
  const groupedPermissions = useMemo(() => {
    return permissions.reduce(
      (acc, perm) => {
        if (!acc[perm.resource]) {
          acc[perm.resource] = []
        }
        acc[perm.resource].push(perm)
        return acc
      },
      {} as Record<string, PermissionData[]>
    )
  }, [permissions])

  const handleAddCustomPermission = () => {
    if (customResource && customAction) {
      addCustomPermission({
        resource: customResource.trim(),
        action: customAction.trim(),
      })
      setCustomResource('')
      setCustomAction('')
    }
  }

  // Check if all permissions in a resource are selected
  const isResourceFullySelected = (resourcePerms: PermissionData[]) => {
    return resourcePerms.every((p) => state.selectedPermissions.includes(p.id))
  }

  return (
    <div className='space-y-6'>
      <div>
        <h2 className='text-xl font-semibold'>Permissions</h2>
        <p className='text-muted-foreground text-sm'>
          Configure permissions for this role
        </p>
      </div>

      {/* Browse Permissions */}
      <div className='space-y-4'>
        {Object.entries(groupedPermissions).map(([resource, perms]) => {
          const allSelected = isResourceFullySelected(perms)
          return (
            <div key={resource} className='rounded-lg border p-4'>
              <div className='mb-3 flex items-center justify-between'>
                <h3 className='font-medium capitalize'>{resource}</h3>
                <button
                  type='button'
                  onClick={() =>
                    selectAllPermissionsForResource(
                      perms.map((p) => p.id),
                      !allSelected
                    )
                  }
                  className='text-primary text-sm hover:underline'
                >
                  {allSelected ? 'Deselect All' : 'Select All'}
                </button>
              </div>
              <div className='grid grid-cols-2 gap-3'>
                {perms.map((perm) => (
                  <label
                    key={perm.id}
                    className='flex items-center gap-2 text-sm'
                  >
                    <input
                      type='checkbox'
                      checked={state.selectedPermissions.includes(perm.id)}
                      onChange={() => togglePermission(perm.id)}
                      className='rounded border-gray-300'
                    />
                    <span>{perm.action}</span>
                  </label>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* Add Custom Permission */}
      <div className='border-t pt-6'>
        <h3 className='mb-3 font-medium'>Add Custom Permission</h3>
        <div className='flex gap-3'>
          <div className='flex-1'>
            <label className='text-muted-foreground mb-1 block text-xs'>
              Resource
            </label>
            <input
              type='text'
              value={customResource}
              onChange={(e) => setCustomResource(e.target.value)}
              placeholder='e.g., report'
              className='border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:outline-none'
            />
          </div>
          <div className='flex-1'>
            <label className='text-muted-foreground mb-1 block text-xs'>
              Action
            </label>
            <input
              type='text'
              value={customAction}
              onChange={(e) => setCustomAction(e.target.value)}
              placeholder='e.g., export'
              className='border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:outline-none'
            />
          </div>
          <button
            type='button'
            onClick={handleAddCustomPermission}
            disabled={!customResource || !customAction}
            className='bg-secondary text-secondary-foreground hover:bg-secondary/80 self-end rounded-md px-4 py-2 text-sm font-medium disabled:opacity-50'
          >
            Add
          </button>
        </div>
        <p className='text-muted-foreground mt-2 text-xs'>
          Format: resource:action (e.g., customer:manage, analytics:export)
        </p>

        {/* List Custom Permissions */}
        {state.customPermissions.length > 0 && (
          <div className='mt-4 space-y-2'>
            <div className='text-sm font-medium'>
              Custom Permissions ({state.customPermissions.length})
            </div>
            {state.customPermissions.map((cp, i) => (
              <div
                key={i}
                className='bg-muted flex items-center justify-between rounded p-2'
              >
                <span className='text-sm'>
                  {cp.resource}:{cp.action}
                </span>
                <button
                  type='button'
                  onClick={() => removeCustomPermission(i)}
                  className='text-destructive text-sm hover:underline'
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Selected Count */}
      <div className='bg-muted rounded-lg p-4 text-sm'>
        <strong>{state.selectedPermissions.length}</strong> standard permissions
        and <strong>{state.customPermissions.length}</strong> custom permissions
        selected
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
          Review & Send Invitation
        </button>
      </div>
    </div>
  )
}
