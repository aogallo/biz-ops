import { createCookieSessionStorage } from 'react-router'

export interface PosCashierSession {
  cashierId: string
  cashierName: string
  organizationId: string
  sucursalId: string
}

const posSessionStorage = createCookieSessionStorage({
  cookie: {
    name: 'pos-cashier-session',
    path: '/',
    httpOnly: true,
    sameSite: 'strict',
    secrets: [process.env.BETTER_AUTH_SECRET ?? 'pos-fallback-secret'],
    maxAge: 60 * 60 * 12, // 12 hours
  },
})

export async function getPosSession(request: Request): Promise<PosCashierSession | null> {
  try {
    const session = await posSessionStorage.getSession(request.headers.get('Cookie'))
    const cashierId = session.get('cashierId')
    const cashierName = session.get('cashierName')
    const organizationId = session.get('organizationId')
    const sucursalId = session.get('sucursalId')

    if (!cashierId || !cashierName || !organizationId || !sucursalId) return null

    return { cashierId, cashierName, organizationId, sucursalId }
  } catch {
    return null
  }
}

export async function setPosSession(
  request: Request,
  data: PosCashierSession
): Promise<string> {
  const session = await posSessionStorage.getSession(request.headers.get('Cookie'))
  session.set('cashierId', data.cashierId)
  session.set('cashierName', data.cashierName)
  session.set('organizationId', data.organizationId)
  session.set('sucursalId', data.sucursalId)
  return posSessionStorage.commitSession(session)
}

export async function clearPosSession(request: Request): Promise<string> {
  const session = await posSessionStorage.getSession(request.headers.get('Cookie'))
  return posSessionStorage.destroySession(session)
}
