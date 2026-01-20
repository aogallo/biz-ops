import { Bell, Building2, LogOut, Settings, User } from 'lucide-react'
import { Form, Link, useMatches } from 'react-router'
import { useAuth, useOptionalOrganization } from '~/contexts/AuthContext'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu'
import { Separator } from './ui/separator'
import { SidebarTrigger } from './ui/sidebar'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './ui/tooltip'

function getInitials(name: string | null, email: string): string {
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

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function isUUID(value: string): boolean {
  return UUID_REGEX.test(value)
}

function formatSegment(segment: string): string {
  return segment
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

function getPageTitle(matches: ReturnType<typeof useMatches>): string {
  // Look for a handle with title in the matched routes (reverse to get most specific first)
  for (const match of [...matches].reverse()) {
    const handle = match.handle as { title?: string } | undefined
    if (handle?.title) {
      return handle.title
    }
  }

  // Fallback: derive title from pathname
  const lastMatch = matches[matches.length - 1]
  if (lastMatch) {
    const pathname = lastMatch.pathname
    const segments = pathname.split('/').filter(Boolean)

    if (segments.length > 0) {
      // Find the last non-UUID segment for the title
      for (let i = segments.length - 1; i >= 0; i--) {
        const segment = segments[i]
        if (!isUUID(segment)) {
          return formatSegment(segment)
        }
      }
    }
  }

  return 'Dashboard'
}

function OrganizationIndicator() {
  const organization = useOptionalOrganization()

  if (!organization) {
    return null
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Link
            to='/organization'
            className='text-muted-foreground hover:text-foreground flex items-center gap-2 transition-colors'
          >
            <Building2 className='h-4 w-4' />
            <span className='hidden text-sm font-medium md:inline'>
              {organization.data.name}
            </span>
            <Badge variant='secondary' className='hidden text-xs md:inline'>
              {organization.membership.role}
            </Badge>
          </Link>
        </TooltipTrigger>
        <TooltipContent className='md:hidden'>
          <p>
            {organization.data.name} ({organization.membership.role})
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

function NotificationBell() {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant='ghost' size='icon' className='h-8 w-8'>
            <Bell className='h-4 w-4' />
            <span className='sr-only'>Notifications</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Notifications</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

function UserProfileDropdown() {
  const { session } = useAuth()
  const user = session.user
  const initials = getInitials(user.name, user.email)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant='ghost' className='relative h-8 w-8 rounded-full'>
          <Avatar className='h-8 w-8'>
            <AvatarImage src={user.image || undefined} alt={user.name || ''} />
            <AvatarFallback className='text-xs'>{initials}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className='w-56' align='end' forceMount>
        <DropdownMenuLabel className='font-normal'>
          <div className='flex flex-col space-y-1'>
            <p className='text-sm leading-none font-medium'>
              {user.name || 'User'}
            </p>
            <p className='text-muted-foreground text-xs leading-none'>
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to='/profile' className='flex cursor-pointer items-center'>
            <User className='mr-2 h-4 w-4' />
            <span>Profile</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to='/settings' className='flex cursor-pointer items-center'>
            <Settings className='mr-2 h-4 w-4' />
            <span>Settings</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Form method='post' action='/logout' className='w-full'>
            <button
              type='submit'
              className='flex w-full cursor-pointer items-center'
            >
              <LogOut className='mr-2 h-4 w-4' />
              <span>Sign out</span>
            </button>
          </Form>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

const SiteHeader = () => {
  const matches = useMatches()
  const pageTitle = getPageTitle(matches)

  return (
    <header className='bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 flex h-14 shrink-0 items-center gap-2 border-b backdrop-blur'>
      <div className='flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6'>
        <SidebarTrigger className='-ml-1' />
        <Separator
          orientation='vertical'
          className='mx-2 data-[orientation=vertical]:h-4'
        />
        <h1 className='text-base font-medium'>{pageTitle}</h1>

        <div className='ml-auto flex items-center gap-2'>
          <OrganizationIndicator />
          <Separator
            orientation='vertical'
            className='mx-1 hidden data-[orientation=vertical]:h-4 md:block'
          />
          <NotificationBell />
          <UserProfileDropdown />
        </div>
      </div>
    </header>
  )
}

export default SiteHeader
