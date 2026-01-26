import { Search } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar'
import { Badge } from '~/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Input } from '~/components/ui/input'

interface UserWithRoles {
  id: string
  name: string | null
  email: string
  image: string | null
  memberId: string
  roles: Array<{
    id: string
    name: string
    description: string | null
    isSystem: boolean
  }>
}

interface UserListPanelProps {
  users: UserWithRoles[]
  selectedMemberId: string | null
  onSelectUser: (memberId: string) => void
  searchQuery: string
  onSearch: (query: string) => void
}

export function UserListPanel({
  users,
  selectedMemberId,
  onSelectUser,
  searchQuery,
  onSearch,
}: UserListPanelProps) {
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

  return (
    <Card className='flex h-[calc(100vh-220px)] flex-col'>
      <CardHeader className='pb-3'>
        <div className='flex items-center justify-between'>
          <CardTitle className='text-lg'>
            Users ({users.length})
          </CardTitle>
        </div>
        <div className='relative'>
          <Search className='text-muted-foreground absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2' />
          <Input
            placeholder='Search by name or email...'
            value={searchQuery}
            onChange={(e) => onSearch(e.target.value)}
            className='pl-9'
          />
        </div>
      </CardHeader>
      <CardContent className='flex-1 overflow-y-auto'>
        <div className='space-y-2'>
          {users.map((user) => {
            const isSelected = user.memberId === selectedMemberId

            return (
              <button
                key={user.memberId}
                type='button'
                onClick={() => onSelectUser(user.memberId)}
                className={`w-full rounded-lg border p-3 text-left transition-colors hover:bg-muted/50 ${
                  isSelected ? 'border-primary bg-primary/5' : ''
                }`}
              >
                <div className='flex items-start gap-3'>
                  <Avatar className='h-10 w-10'>
                    <AvatarImage src={user.image || undefined} alt={user.name || user.email} />
                    <AvatarFallback>{getInitials(user.name, user.email)}</AvatarFallback>
                  </Avatar>
                  <div className='min-w-0 flex-1'>
                    <p className='truncate font-medium'>{user.name || 'Unnamed User'}</p>
                    <p className='text-muted-foreground truncate text-sm'>{user.email}</p>
                    {user.roles.length > 0 && (
                      <div className='mt-1 flex flex-wrap gap-1'>
                        {user.roles.map((role) => (
                          <Badge
                            key={role.id}
                            variant={role.isSystem ? 'secondary' : 'outline'}
                            className='text-xs'
                          >
                            {role.name}
                          </Badge>
                        ))}
                      </div>
                    )}
                    {user.roles.length === 0 && (
                      <p className='text-muted-foreground mt-1 text-xs italic'>No roles assigned</p>
                    )}
                  </div>
                </div>
              </button>
            )
          })}

          {users.length === 0 && (
            <div className='text-muted-foreground py-8 text-center'>
              {searchQuery ? 'No users match your search' : 'No users in this organization'}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
