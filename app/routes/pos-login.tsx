import { useState } from 'react'
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

  const organizations = await posRepository.getActiveOrganizations()
  return { organizations }
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData()
  const intent = formData.get('intent')

  if (intent === 'select-org') {
    const organizationId = formData.get('organizationId')
    if (!organizationId || typeof organizationId !== 'string') {
      return { error: 'Organization is required' }
    }

    const cashiers = await posRepository.getActiveCashiersForOrganization(organizationId)
    return { cashiers, selectedOrgId: organizationId }
  }

  if (intent === 'login') {
    const organizationId = formData.get('organizationId')
    const cashierId = formData.get('cashierId')
    const pin = formData.get('pin')

    if (
      !organizationId || typeof organizationId !== 'string' ||
      !cashierId || typeof cashierId !== 'string' ||
      !pin || typeof pin !== 'string'
    ) {
      return { error: 'All fields are required', intent: 'login' }
    }

    const cashier = await posRepository.verifyCashierPin(cashierId, pin)
    if (!cashier) {
      return { error: 'Invalid PIN or cashier is locked', intent: 'login', cashierId, organizationId }
    }

    const cookie = await setPosSession(request, {
      cashierId: cashier.id,
      cashierName: cashier.name,
      organizationId,
    })

    throw redirect('/pos', { headers: { 'Set-Cookie': cookie } })
  }

  return { error: 'Unknown action' }
}

export default function PosLogin({ loaderData }: Route.ComponentProps) {
  const { organizations } = loaderData
  const actionData = useActionData<typeof action>()
  const navigation = useNavigation()
  const isSubmitting = navigation.state === 'submitting'

  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(
    actionData && 'selectedOrgId' in actionData ? actionData.selectedOrgId ?? null : null
  )

  const cashiers =
    actionData && 'cashiers' in actionData
      ? (actionData.cashiers as Array<{ id: string; name: string; hasPin: boolean }>)
      : null

  return (
    <div className='bg-background flex min-h-screen items-center justify-center p-4'>
      <Card className='w-full max-w-sm'>
        <CardHeader>
          <CardTitle className='text-center text-2xl'>POS Login</CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          {actionData && 'error' in actionData && actionData.error && (
            <div className='rounded-md bg-red-50 p-3 text-sm text-red-600 dark:bg-red-950/30'>
              {actionData.error}
            </div>
          )}

          {!cashiers ? (
            /* Step 1: Select organization */
            <Form method='post' className='space-y-3'>
              <input type='hidden' name='intent' value='select-org' />
              <div className='space-y-2'>
                <label className='text-sm font-medium'>Organization</label>
                <select
                  name='organizationId'
                  className='border-input bg-background w-full rounded-md border px-3 py-2 text-sm'
                  defaultValue=''
                  required
                >
                  <option value='' disabled>
                    Select an organization…
                  </option>
                  {organizations.map((org) => (
                    <option key={org.id} value={org.id}>
                      {org.name}
                    </option>
                  ))}
                </select>
              </div>
              <Button type='submit' className='w-full' disabled={isSubmitting}>
                {isSubmitting ? 'Loading…' : 'Continue'}
              </Button>
            </Form>
          ) : (
            /* Step 2: Select cashier + PIN */
            <Form method='post' className='space-y-3'>
              <input type='hidden' name='intent' value='login' />
              <input type='hidden' name='organizationId' value={selectedOrgId ?? ''} />

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

              <Button
                type='button'
                variant='ghost'
                className='w-full'
                onClick={() => setSelectedOrgId(null)}
              >
                ← Back
              </Button>
            </Form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
