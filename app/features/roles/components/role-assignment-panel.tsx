import { Form } from 'react-router'
import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'

interface Role {
  id: string
  name: string
  description: string | null
  isSystem: boolean
}

interface UserWithRoles {
  id: string
  name: string | null
  email: string
  image: string | null
  memberId: string
  roles: Role[]
}

interface RoleAssignmentPanelProps {
  user: UserWithRoles | null
  userRoles: Role[]
  availableRoles: Role[]
  organizationId: string
  isSubmitting: boolean
  error?: string
}

export function RoleAssignmentPanel({
  user,
  userRoles,
  availableRoles,
  organizationId,
  isSubmitting,
  error,
}: RoleAssignmentPanelProps) {
  const getInitials = (name: string | null, email: string) => {
    if (name) {
      return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    }
    return email.slice(0, 2).toUpperCase()
  }

  const userRoleIds = userRoles.map((r) => r.id)

  if (!user) {
    return (
      <Card className='flex h-[calc(100vh-220px)] items-center justify-center'>
        <div className='text-muted-foreground text-center'>
          <p className='text-lg'>Select a user</p>
          <p className='text-sm'>Choose a user from the list to assign roles</p>
        </div>
      </Card>
    )
  }

  return (
    <Card className='flex h-[calc(100vh-220px)] flex-col'>
      <CardHeader className='pb-4'>
        <div className='flex items-center gap-4'>
          <Avatar className='h-12 w-12'>
            <AvatarImage src={user.image || undefined} alt={user.name || user.email} />
            <AvatarFallback className='text-lg'>{getInitials(user.name, user.email)}</AvatarFallback>
          </Avatar>
          <div>
            <CardTitle>{user.name || 'Unnamed User'}</CardTitle>
            <CardDescription>{user.email}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className='flex flex-1 flex-col overflow-hidden'>
        {error && (
          <div className='bg-destructive/10 text-destructive mb-4 rounded-md p-3 text-sm'>
            {error}
          </div>
        )}

        <Form method='post' className='flex flex-1 flex-col overflow-hidden'>
          <input type='hidden' name='memberId' value={user.memberId} />
          <input type='hidden' name='organizationId' value={organizationId} />

          <div className='mb-4'>
            <h3 className='text-sm font-medium'>Assign Roles</h3>
            <p className='text-muted-foreground text-sm'>
              Select the roles for this user. The user will have combined permissions from all
              selected roles.
            </p>
          </div>

          <div className='flex-1 space-y-3 overflow-y-auto pr-2'>
            {availableRoles.map((role) => {
              const isChecked = userRoleIds.includes(role.id)

              return (
                <label
                  key={role.id}
                  className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors hover:bg-muted/50 ${
                    isChecked ? 'border-primary bg-primary/5' : ''
                  }`}
                >
                  <input
                    type='checkbox'
                    name='roleIds'
                    value={role.id}
                    defaultChecked={isChecked}
                    className='mt-1'
                  />
                  <div className='flex-1'>
                    <div className='flex items-center gap-2'>
                      <span className='font-medium'>{role.name}</span>
                      {role.isSystem && (
                        <Badge variant='secondary' className='text-xs'>
                          System
                        </Badge>
                      )}
                    </div>
                    {role.description && (
                      <p className='text-muted-foreground text-sm'>{role.description}</p>
                    )}
                  </div>
                </label>
              )
            })}

            {availableRoles.length === 0 && (
              <div className='text-muted-foreground py-8 text-center'>
                No roles available for this organization
              </div>
            )}
          </div>

          <div className='mt-4 flex gap-3 border-t pt-4'>
            <Button type='reset' variant='outline' disabled={isSubmitting}>
              Discard
            </Button>
            <Button type='submit' disabled={isSubmitting || availableRoles.length === 0}>
              {isSubmitting ? 'Saving...' : 'Save Roles'}
            </Button>
          </div>
        </Form>
      </CardContent>
    </Card>
  )
}
