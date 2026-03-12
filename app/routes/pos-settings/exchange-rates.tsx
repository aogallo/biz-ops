import { Form, useActionData } from 'react-router'
import { exchangeRateRepository } from '~/features/exchangeRate/server/repository'
import { setExchangeRateSchema } from '~/features/exchangeRate/schemas'
import { setExchangeRateAction } from '~/features/exchangeRate/server/actions/set-exchange-rate.action'
import { requireModule } from '~/server/auth/module.server'
import type { Route } from './+types/exchange-rates'

export async function loader({ request }: Route.LoaderArgs) {
  const session = await requireModule(request, 'pos')
  const organizationId = session.session.activeOrganizationId!

  const [activeUsdRate, rateHistory] = await Promise.all([
    exchangeRateRepository.getActiveRate(organizationId, 'USD', 'GTQ'),
    exchangeRateRepository.getRateHistory(organizationId, 'USD', 'GTQ'),
  ])

  return { activeUsdRate, rateHistory, organizationId }
}

export async function action({ request }: Route.ActionArgs) {
  const session = await requireModule(request, 'pos')
  const organizationId = session.session.activeOrganizationId!
  const formData = await request.formData()

  const result = setExchangeRateSchema.safeParse({
    organizationId,
    fromCurrency: 'USD',
    toCurrency: 'GTQ',
    rate: Number(formData.get('rate')),
    effectiveDate: new Date().toISOString().split('T')[0],
    createdBy: session.user.id,
  })

  if (!result.success) {
    return { error: 'Tasa de cambio inválida' }
  }

  try {
    await setExchangeRateAction(result.data)
    return { success: true }
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : 'Error al guardar la tasa',
    }
  }
}

export default function ExchangeRatesPage({
  loaderData,
}: Route.ComponentProps) {
  const { activeUsdRate, rateHistory } = loaderData
  const actionData = useActionData<typeof action>()

  return (
    <div className='container max-w-2xl py-8'>
      <h1 className='mb-6 text-2xl font-bold'>Tasas de Cambio</h1>

      {/* Current rate */}
      <div className='mb-6 rounded-lg border p-4'>
        <h2 className='mb-2 font-semibold'>Tasa USD → GTQ activa</h2>
        {activeUsdRate ? (
          <p className='text-2xl font-bold tabular-nums'>
            Q{Number(activeUsdRate.rate).toFixed(4)}
          </p>
        ) : (
          <p className='text-muted-foreground text-sm'>Sin tasa configurada</p>
        )}
      </div>

      {/* Set new rate */}
      <div className='mb-6 rounded-lg border p-4'>
        <h2 className='mb-4 font-semibold'>Actualizar tasa USD → GTQ</h2>
        {actionData && 'error' in actionData && (
          <p className='mb-3 text-sm text-red-600'>{actionData.error}</p>
        )}
        {actionData && 'success' in actionData && (
          <p className='mb-3 text-sm text-green-600'>
            Tasa actualizada correctamente
          </p>
        )}
        <Form method='post' className='flex gap-3'>
          <input
            name='rate'
            type='number'
            step='0.0001'
            min='0'
            placeholder='7.8000'
            defaultValue={activeUsdRate ? Number(activeUsdRate.rate) : ''}
            className='flex-1 rounded-md border px-3 py-2 text-sm'
            required
          />
          <button
            type='submit'
            className='bg-primary text-primary-foreground hover:bg-primary/90 rounded-md px-4 py-2 text-sm font-medium'
          >
            Guardar
          </button>
        </Form>
      </div>

      {/* Rate history */}
      {rateHistory.length > 0 && (
        <div className='rounded-lg border p-4'>
          <h2 className='mb-3 font-semibold'>Historial</h2>
          <div className='space-y-2'>
            {rateHistory
              .slice(-10)
              .reverse()
              .map((r) => (
                <div key={r.id} className='flex justify-between text-sm'>
                  <span className='text-muted-foreground'>
                    {r.effectiveDate}
                  </span>
                  <span
                    className={
                      r.isActive ? 'font-bold' : 'text-muted-foreground'
                    }
                  >
                    Q{Number(r.rate).toFixed(4)}
                    {r.isActive && ' (activa)'}
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  )
}
