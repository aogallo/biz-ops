import { Monitor } from 'lucide-react'
import { Form, Link, redirect } from 'react-router'
import { Button } from '~/components/ui/button'
import { posRepository } from '~/features/pos/server/repository'
import { getOptionalAuth } from '~/server/auth/session.server'
import { getPosSession } from '~/server/auth/pos-session.server'
import { isStaleSession } from '~/features/pos/server/utils/session-date'
import { autoCloseStaleSessionAction } from '~/features/pos/server/actions/auto-close-stale-session.action'
import { useTranslation } from '~/i18n/context'
import { cn } from '~/lib/utils'
import type { Route } from './+types/index'

export async function loader({ request }: Route.LoaderArgs) {
  const [userSession, posSession] = await Promise.all([
    getOptionalAuth(request),
    getPosSession(request),
  ])

  if (!userSession && !posSession) {
    throw redirect('/pos-login')
  }

  const organizationId =
    posSession?.organizationId ?? userSession?.session.activeOrganizationId

  const userName = posSession?.cashierName ?? userSession?.user.name ?? ''

  if (!organizationId) {
    return { terminals: [], userName }
  }

  // Resolve cashier to check for an existing open session
  let cashier = null
  if (posSession) {
    cashier = await posRepository.getCashierById(posSession.cashierId)
  } else if (userSession) {
    cashier = await posRepository.getCashierByUserId(
      organizationId,
      userSession.user.id
    )
  }

  if (cashier) {
    const openSession = await posRepository.getOpenSessionByCashier(cashier.id)
    if (openSession) {
      if (isStaleSession(new Date(openSession.openedAt))) {
        await autoCloseStaleSessionAction(openSession.id)
        // Don't redirect — let cashier pick terminal and open a fresh session
      } else {
        throw redirect(`/pos/terminal?terminalId=${openSession.terminalId}`)
      }
    }
  }

  const terminals = await posRepository.getTerminals(organizationId)
  return { terminals, userName, hasUserSession: !!userSession }
}

export default function PosIndex({ loaderData }: Route.ComponentProps) {
  const { terminals, userName, hasUserSession } = loaderData
  const { t } = useTranslation()

  const activeTerminals = terminals.filter((t) => t.isActive)

  return (
    <div className='flex flex-1 flex-col items-center justify-center p-8'>
      <div className='w-full max-w-2xl space-y-6'>
        <div className='text-center'>
          <h1 className='text-2xl font-bold'>{t('pos.title')}</h1>
          <p className='text-muted-foreground mt-1'>
            {t('pos.welcome', { name: userName })}
          </p>
        </div>

        {activeTerminals.length === 0 ? (
          <div className='text-muted-foreground rounded-lg border border-dashed p-12 text-center'>
            <Monitor className='mx-auto mb-3 size-10' />
            <p className='font-medium'>{t('pos.noTerminals')}</p>
            <p className='mt-1 text-sm'>{t('pos.noTerminalsDescription')}</p>
            <Button variant='outline' className='mt-4' asChild>
              <Link to='/pos-settings/terminals'>
                {t('pos.configureTerminals')}
              </Link>
            </Button>
          </div>
        ) : (
          <div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
            {activeTerminals.map((terminal) => (
              <Link
                key={terminal.id}
                to={`/pos/terminal?terminalId=${terminal.id}`}
                className={cn(
                  'bg-card hover:bg-accent flex items-center gap-4 rounded-lg border p-6 transition-colors'
                )}
              >
                <Monitor className='text-primary size-8' />
                <div>
                  <p className='font-semibold'>{terminal.name}</p>
                  <p className='text-muted-foreground text-sm'>
                    {terminal.sucursalName}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}

        <div className='flex items-center justify-center gap-3'>
          {hasUserSession && (
            <Button variant='ghost' size='sm' asChild>
              <Link to='/dashboard'>Volver al ERP</Link>
            </Button>
          )}
          <Form method='post' action='/logout'>
            <Button
              variant='ghost'
              size='sm'
              type='submit'
              className='cursor-pointer'
            >
              Cerrar sesión
            </Button>
          </Form>
        </div>
      </div>
    </div>
  )
}
