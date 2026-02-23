import { Form, redirect, useActionData, useNavigation } from 'react-router'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { posRepository } from '~/features/pos/server/repository'
import { getOptionalAuth } from '~/server/auth/session.server'
import { getPosSession, setPosSession } from '~/server/auth/pos-session.server'
import type { Route } from './+types/pos-login'

export async function loader({ request }: Route.LoaderArgs) {
  const [userSession, posSession] = await Promise.all([
    getOptionalAuth(request),
    getPosSession(request),
  ])

  if (userSession || posSession) {
    throw redirect('/pos')
  }

  const url = new URL(request.url)
  const companyId = url.searchParams.get('companyId')

  const companies = await posRepository.getActiveCompanies()

  if (companyId) {
    const cashiers = await posRepository.getActiveCashiersForCompany(companyId)
    const company = companies.find((c) => c.id === companyId) ?? null
    return { companies, cashiers, selectedCompanyId: companyId, company }
  }

  return { companies, cashiers: null, selectedCompanyId: null, company: null }
}

export async function action({ request }: Route.ActionArgs) {
  const url = new URL(request.url)
  const companyId = url.searchParams.get('companyId')
  const formData = await request.formData()
  const cashierId = formData.get('cashierId')
  const pin = formData.get('pin')

  if (!companyId || !cashierId || typeof cashierId !== 'string' || !pin || typeof pin !== 'string') {
    return { error: 'All fields are required' }
  }

  const cashier = await posRepository.verifyCashierPin(cashierId, pin)
  if (!cashier) {
    return { error: 'Invalid PIN or account is locked' }
  }

  const cookie = await setPosSession(request, {
    cashierId: cashier.id,
    cashierName: cashier.name,
    organizationId: cashier.organizationId,
    companyId: cashier.companyId,
  })

  throw redirect('/pos', { headers: { 'Set-Cookie': cookie } })
}

export default function PosLogin({ loaderData }: Route.ComponentProps) {
  const { companies, cashiers, company } = loaderData
  const actionData = useActionData<typeof action>()
  const navigation = useNavigation()
  const isSubmitting = navigation.state === 'submitting' || navigation.state === 'loading'

  return (
    <div className='bg-background flex min-h-screen items-center justify-center p-4'>
      <Card className='w-full max-w-sm'>
        <CardHeader>
          <CardTitle className='text-center text-2xl'>POS Login</CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          {cashiers === null ? (
            /* Step 1: Select company — GET form updates the URL */
            <Form method='get' className='space-y-3'>
              <div className='space-y-2'>
                <label className='text-sm font-medium'>Company</label>
                <select
                  name='companyId'
                  className='border-input bg-background w-full rounded-md border px-3 py-2 text-sm'
                  defaultValue=''
                  required
                >
                  <option value='' disabled>
                    Select a company…
                  </option>
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <Button type='submit' className='w-full' disabled={isSubmitting}>
                {isSubmitting ? 'Loading…' : 'Continue'}
              </Button>
            </Form>
          ) : (
            /* Step 2: Select cashier + PIN — POST form */
            <Form method='post' className='space-y-3'>
              {actionData?.error && (
                <div className='rounded-md bg-red-50 p-3 text-sm text-red-600 dark:bg-red-950/30'>
                  {actionData.error}
                </div>
              )}

              {company && (
                <p className='text-muted-foreground text-sm'>
                  {company.name}
                </p>
              )}

              <div className='space-y-2'>
                <label className='text-sm font-medium'>Cashier</label>
                <select
                  name='cashierId'
                  className='border-input bg-background w-full rounded-md border px-3 py-2 text-sm'
                  defaultValue=''
                  required
                >
                  <option value='' disabled>
                    Select a cashier…
                  </option>
                  {cashiers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className='space-y-2'>
                <label className='text-sm font-medium'>PIN</label>
                <input
                  type='password'
                  name='pin'
                  inputMode='numeric'
                  maxLength={6}
                  className='border-input bg-background w-full rounded-md border px-3 py-2 text-sm tracking-widest'
                  placeholder='••••'
                  required
                  autoFocus
                />
              </div>

              <Button type='submit' className='w-full' disabled={isSubmitting}>
                {isSubmitting ? 'Signing in…' : 'Sign In'}
              </Button>

              <Button variant='ghost' className='w-full' asChild>
                <a href='/pos-login'>← Back</a>
              </Button>
            </Form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
