import { redirect } from 'react-router'
import type { Route } from './+types/action.set-locale'

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData()
  const locale = formData.get('locale') as string

  if (!locale || !['en', 'es'].includes(locale)) {
    return redirect('/')
  }

  // Set locale cookie
  const headers = new Headers()
  headers.set(
    'Set-Cookie',
    `locale=${locale}; Path=/; Max-Age=${60 * 60 * 24 * 365}; SameSite=Lax`
  )

  const referer = request.headers.get('Referer') || '/'
  return redirect(referer, { headers })
}

export async function loader() {
  return redirect('/')
}
