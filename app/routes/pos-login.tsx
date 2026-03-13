import { Form, redirect, useActionData, useNavigation } from 'react-router'
import { useState } from 'react'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { posRepository } from '~/features/pos/server/repository'
import { sucursalRepository } from '~/features/sucursal/server/repository/sucursal.repository'
import { getOptionalAuth } from '~/server/auth/session.server'
import { getPosSession, setPosSession } from '~/server/auth/pos-session.server'
import type { Route } from './+types/pos-login'

export async function loader({ request }: Route.LoaderArgs) {
  const [userSession, posSession] = await Promise.all([
    getOptionalAuth(request),
    getPosSession(request),
  ])

  if (posSession?.role === 'kitchen') {
    throw redirect(`/kitchen/${posSession.sucursalId}`)
  }

  if (userSession || posSession) {
    throw redirect('/pos')
  }

  return {}
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData()
  const intent = formData.get('intent')
  const sucursalCode = formData.get('sucursalCode')
  const pin = formData.get('pin')

  if (
    !sucursalCode ||
    typeof sucursalCode !== 'string' ||
    !pin ||
    typeof pin !== 'string'
  ) {
    return { error: 'Todos los campos son requeridos' }
  }

  if (intent === 'kitchen') {
    const sucursal = await sucursalRepository.verifyKitchenPin(
      sucursalCode.trim(),
      pin.trim()
    )

    if (!sucursal) {
      return { error: 'Código de sucursal o PIN de cocina inválido' }
    }

    const cookie = await setPosSession(request, {
      cashierId: sucursal.id,
      cashierName: 'Cocina',
      organizationId: sucursal.organizationId,
      sucursalId: sucursal.id,
      role: 'kitchen',
    })

    throw redirect(`/kitchen/${sucursal.id}`, {
      headers: { 'Set-Cookie': cookie },
    })
  }

  // Default: cashier login
  const cashier = await posRepository.verifyCashierBySucursalAndPin(
    sucursalCode.trim(),
    pin.trim()
  )

  if (!cashier) {
    return { error: 'Código de sucursal o PIN inválido' }
  }

  const cookie = await setPosSession(request, {
    cashierId: cashier.id,
    cashierName: cashier.name,
    organizationId: cashier.organizationId,
    sucursalId: cashier.sucursalId,
    role: 'cashier',
  })

  throw redirect('/pos', { headers: { 'Set-Cookie': cookie } })
}

export default function PosLogin() {
  const actionData = useActionData<typeof action>()
  const navigation = useNavigation()
  const isSubmitting =
    navigation.state === 'submitting' || navigation.state === 'loading'
  const [mode, setMode] = useState<'cashier' | 'kitchen'>('cashier')

  return (
    <div className='bg-background flex min-h-screen items-center justify-center p-4'>
      <Card className='w-full max-w-sm'>
        <CardHeader>
          <CardTitle className='text-center text-2xl'>
            {mode === 'cashier' ? 'POS Login' : 'Cocina Login'}
          </CardTitle>
          <div className='mt-2 flex rounded-md border'>
            <button
              type='button'
              onClick={() => setMode('cashier')}
              className={`flex-1 rounded-l-md px-3 py-1.5 text-sm font-medium transition-colors ${
                mode === 'cashier'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted'
              }`}
            >
              Caja
            </button>
            <button
              type='button'
              onClick={() => setMode('kitchen')}
              className={`flex-1 rounded-r-md px-3 py-1.5 text-sm font-medium transition-colors ${
                mode === 'kitchen'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted'
              }`}
            >
              Cocina
            </button>
          </div>
        </CardHeader>
        <CardContent>
          <Form method='post' className='space-y-4'>
            <input type='hidden' name='intent' value={mode} />

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
              <label className='text-sm font-medium'>
                {mode === 'kitchen' ? 'PIN de Cocina' : 'PIN'}
              </label>
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
