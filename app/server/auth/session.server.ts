import { redirect } from 'react-router'
import auth from '~/server/auth-server'
import { isSuperAdmin } from '../permissions'

export interface SessionData {
  session: {
    userId: string
    token: string
    expiresAt: Date
    activeOrganizationId: string | null
  }
  user: {
    id: string
    email: string
    emailVerified: boolean
    name: string
    image: string | null
    isSuperAdmin: boolean
  }
}

/**
 * Get authenticated session or redirect to login
 * Use this in loaders for protected routes
 */
export async function requireAuth(request: Request): Promise<SessionData> {
  const session = await auth.api.getSession({
    headers: request.headers,
  })

  if (!session?.session || !session?.user) {
    throw redirect('/login', {
      headers: {
        'Set-Cookie': 'redirectTo=' + new URL(request.url).pathname,
      },
    })
  }

  const isSA = await isSuperAdmin(session.user.id)

  const customSession = {
    ...session,
    user: { ...session.user, isSuperAdmin: isSA },
  }

  return customSession as SessionData
}

/**
 * Get session if exists, but don't redirect
 * Use this for optional auth routes
 */
export async function getOptionalAuth(
  request: Request
): Promise<SessionData | null> {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    })

    if (!session?.session || !session?.user) {
      return null
    }

    const isSA = await isSuperAdmin(session.user.id)

    const customSession = {
      ...session,
      user: { ...session.user, isSuperAdmin: isSA },
    }

    return customSession as SessionData
  } catch {
    return null
  }
}

/**
 * Sign out and redirect to login
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function logout(request: Request) {
  // Better Auth handles cookie clearing
  return redirect('/login', {
    headers: {
      'Set-Cookie': 'better-auth.session_token=; Max-Age=0; Path=/',
    },
  })
}
