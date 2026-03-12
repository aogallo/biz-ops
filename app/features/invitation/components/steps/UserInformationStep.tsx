import { Label } from '~/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'
import type { RoleData, WizardState } from '../../types'

interface UserInformationStepProps {
  state: WizardState
  roles: RoleData[]
  updateField: <K extends keyof WizardState>(
    field: K,
    value: WizardState[K]
  ) => void
  nextStep: () => void
}

export function UserInformationStep({
  state,
  updateField,
  nextStep,
  roles,
}: UserInformationStepProps) {
  const defaultRole = roles.find((role) => role.name === 'member')

  // Set default role if no roles are selected
  if (defaultRole && state.roleIds.length === 0) {
    updateField('roleIds', [defaultRole.id])
  }

  const handleOrganizationRoleChange = (id: string) => {
    console.log(id)
    updateField('roleIds', [id])
    updateField('createNewRole', false)
  }

  return (
    <div className='space-y-6'>
      <div>
        <h2 className='text-xl font-semibold'>User Information</h2>
        <p className='text-muted-foreground text-sm'>
          Enter the basic details for the user you want to invite
        </p>
      </div>

      <div>
        <label htmlFor='name' className='mb-2 block text-sm font-medium'>
          Full Name
        </label>
        <input
          type='text'
          id='name'
          value={state.name}
          onChange={(e) => updateField('name', e.target.value)}
          placeholder='John Doe'
          className='border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:outline-none'
        />
        {state.errors.name && (
          <p className='text-destructive mt-1 text-sm'>{state.errors.name}</p>
        )}
      </div>

      <div>
        <label htmlFor='email' className='mb-2 block text-sm font-medium'>
          Email Address
        </label>
        <input
          type='email'
          id='email'
          value={state.email}
          onChange={(e) => updateField('email', e.target.value)}
          placeholder='john@example.com'
          className='border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:outline-none'
        />
        {state.errors.email && (
          <p className='text-destructive mt-1 text-sm'>{state.errors.email}</p>
        )}
        <p className='text-muted-foreground mt-1 text-xs'>
          An invitation will be sent to this email address
        </p>
      </div>
      <div className=''>
        <Label htmlFor='role-select' className='mb-2 text-sm font-medium'>
          Role
        </Label>
        <Select
          value={state.roleIds[0] || defaultRole?.id || ''}
          onValueChange={handleOrganizationRoleChange}
        >
          <SelectTrigger id='role-select' className='w-full'>
            <SelectValue placeholder='Select role (defaults to member)' />
          </SelectTrigger>
          <SelectContent>
            {roles.map((role) => (
              <SelectItem key={role.id} value={role.id}>
                {role.id} - {role.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {state.errors.roleIds && (
          <p className='text-destructive mt-1 text-sm'>
            {state.errors.roleIds}
          </p>
        )}
        <p className='text-muted-foreground mt-1 text-xs'>
          An invitation will be sent to this email address
        </p>
      </div>

      <button
        type='button'
        onClick={nextStep}
        className='bg-primary text-primary-foreground hover:bg-primary/90 w-full rounded-md px-4 py-2 text-sm font-medium'
      >
        Continue to Role Selection
      </button>
    </div>
  )
}
