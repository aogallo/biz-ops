import { redirect } from 'react-router'
import { clearPosSession } from '~/server/auth/pos-session.server'
import type { Route } from './+types/pos-logout'

export async function action({ request }: Route.ActionArgs) {
  const cookie = await clearPosSession(request)
  throw redirect('/pos-login', { headers: { 'Set-Cookie': cookie } })
}

export function loader() {
  return redirect('/pos-login')
}
