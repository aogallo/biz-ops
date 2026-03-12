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

  return {}
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData()
  const sucursalCode = formData.get('sucursalCode')
  const pin = formData.get('pin')

  if (
    !sucursalCode ||
    typeof sucursalCode !== 'string' ||
    !pin ||
    typeof pin !== 'string'
  ) {
    return { error: 'All fields are required' }
  }

  const cashier = await posRepository.verifyCashierBySucursalAndPin(
    sucursalCode.trim(),
    pin.trim()
  )

  if (!cashier) {
    return { error: 'Invalid sucursal code or PIN' }
  }

  const cookie = await setPosSession(request, {
    cashierId: cashier.id,
    cashierName: cashier.name,
    organizationId: cashier.organizationId,
    sucursalId: cashier.sucursalId,
  })

  throw redirect('/pos', { headers: { 'Set-Cookie': cookie } })
}

export default function PosLogin() {
  const actionData = useActionData<typeof action>()
  const navigation = useNavigation()
  const isSubmitting =
    navigation.state === 'submitting' || navigation.state === 'loading'

  return (
    <div className='bg-background flex min-h-screen items-center justify-center p-4'>
      <Card className='w-full max-w-sm'>
        <CardHeader>
          <CardTitle className='text-center text-2xl'>POS Login</CardTitle>
        </CardHeader>
        <CardContent>
          <Form method='post' className='space-y-4'>
            {actionData?.error && (
              <div className='rounded-md bg-red-50 p-3 text-sm text-red-600 dark:bg-red-950/30'>
                {actionData.error}
              </div>
            )}

            <div className='space-y-2'>
              <label className='text-sm font-medium'>Código de Sucursal</label>
              <input
                type='text'
                name='sucursalCode'
                autoCapitalize='characters'
                autoComplete='off'
                spellCheck={false}
                className='border-input bg-background w-full rounded-md border px-3 py-2 text-sm tracking-widest uppercase'
                placeholder='SUCURSAL-01'
                required
                autoFocus
              />
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
              />
            </div>

            <Button type='submit' className='w-full' disabled={isSubmitting}>
              {isSubmitting ? 'Iniciando sesión…' : 'Ingresar'}
            </Button>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
