import { useRevalidator } from 'react-router'
import { useEffect } from 'react'
import { kitchenRepository } from '~/features/kitchen/server/repository'
import { updateTicketStatusAction, updateItemStatusAction } from '~/features/kitchen/server/actions/update-ticket-status.action'
import { updateTicketStatusSchema, updateItemStatusSchema } from '~/features/kitchen/schemas'
import type { Route } from './+types/$sucursalId'

export async function loader({ params }: Route.LoaderArgs) {
  const { sucursalId } = params
  if (!sucursalId) return { tickets: [], sucursalId: '' }

  const tickets = await kitchenRepository.getOpenTickets(sucursalId)
  return { tickets, sucursalId }
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData()
  const intent = formData.get('intent')

  if (intent === 'update-ticket') {
    const parsed = updateTicketStatusSchema.safeParse({
      ticketId: formData.get('ticketId'),
      status: formData.get('status'),
    })
    if (!parsed.success) return { error: 'Invalid data' }
    await updateTicketStatusAction(parsed.data)
    return { success: true }
  }

  if (intent === 'update-item') {
    const parsed = updateItemStatusSchema.safeParse({
      itemId: formData.get('itemId'),
      status: formData.get('status'),
    })
    if (!parsed.success) return { error: 'Invalid data' }
    await updateItemStatusAction(parsed.data)
    return { success: true }
  }

  return { error: 'Unknown intent' }
}

export default function KitchenDisplay({ loaderData }: Route.ComponentProps) {
  const { tickets, sucursalId } = loaderData
  const { revalidate } = useRevalidator()

  // Poll every 10 seconds (Cloudflare Workers compatible — no SSE/WebSocket)
  useEffect(() => {
    const interval = setInterval(() => {
      revalidate()
    }, 10000)
    return () => clearInterval(interval)
  }, [revalidate])

  const pending = tickets.filter((t) => t.status === 'pending')
  const inProgress = tickets.filter((t) => t.status === 'in_progress')

  return (
    <div className='flex h-screen flex-col bg-gray-950 text-white'>
      {/* Header */}
      <div className='flex items-center justify-between border-b border-gray-800 px-6 py-3'>
        <h1 className='text-xl font-bold'>Cocina</h1>
        <span className='text-sm text-gray-400'>
          {tickets.length} pedidos activos
        </span>
      </div>

      {/* Board */}
      <div className='flex flex-1 overflow-hidden'>
        {/* Pending column */}
        <div className='flex flex-1 flex-col border-r border-gray-800'>
          <div className='border-b border-gray-800 px-4 py-2'>
            <h2 className='font-semibold text-yellow-400'>
              Pendientes ({pending.length})
            </h2>
          </div>
          <div className='flex-1 overflow-y-auto p-3 space-y-3'>
            {pending.map((ticket) => (
              <div
                key={ticket.id}
                className='rounded-lg border border-yellow-500/30 bg-yellow-950/20 p-3'
              >
                <div className='mb-2 flex items-center justify-between'>
                  <span className='text-lg font-bold text-yellow-400'>
                    #{ticket.ticketNumber}
                  </span>
                  <form method='post' action={`/kitchen/${sucursalId}`}>
                    <input type='hidden' name='intent' value='update-ticket' />
                    <input type='hidden' name='ticketId' value={ticket.id} />
                    <input type='hidden' name='status' value='in_progress' />
                    <button
                      type='submit'
                      className='rounded bg-yellow-500 px-2 py-1 text-xs font-medium text-black hover:bg-yellow-400'
                    >
                      Iniciar
                    </button>
                  </form>
                </div>
                {ticket.notes && (
                  <p className='mb-2 text-xs text-gray-400'>{ticket.notes}</p>
                )}
                <ul className='space-y-1'>
                  {ticket.items.map((item) => (
                    <li key={item.id} className='text-sm'>
                      <span className='font-medium'>
                        {item.quantity}x {item.productName}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* In Progress column */}
        <div className='flex flex-1 flex-col'>
          <div className='border-b border-gray-800 px-4 py-2'>
            <h2 className='font-semibold text-blue-400'>
              En proceso ({inProgress.length})
            </h2>
          </div>
          <div className='flex-1 overflow-y-auto p-3 space-y-3'>
            {inProgress.map((ticket) => (
              <div
                key={ticket.id}
                className='rounded-lg border border-blue-500/30 bg-blue-950/20 p-3'
              >
                <div className='mb-2 flex items-center justify-between'>
                  <span className='text-lg font-bold text-blue-400'>
                    #{ticket.ticketNumber}
                  </span>
                  <form method='post' action={`/kitchen/${sucursalId}`}>
                    <input type='hidden' name='intent' value='update-ticket' />
                    <input type='hidden' name='ticketId' value={ticket.id} />
                    <input type='hidden' name='status' value='ready' />
                    <button
                      type='submit'
                      className='rounded bg-green-500 px-2 py-1 text-xs font-medium text-white hover:bg-green-400'
                    >
                      Listo
                    </button>
                  </form>
                </div>
                {ticket.notes && (
                  <p className='mb-2 text-xs text-gray-400'>{ticket.notes}</p>
                )}
                <ul className='space-y-1'>
                  {ticket.items.map((item) => (
                    <li key={item.id} className='flex items-center gap-2 text-sm'>
                      <span
                        className={
                          item.status === 'ready'
                            ? 'text-green-400 line-through'
                            : ''
                        }
                      >
                        {item.quantity}x {item.productName}
                      </span>
                      {item.status !== 'ready' && (
                        <form method='post' action={`/kitchen/${sucursalId}`}>
                          <input type='hidden' name='intent' value='update-item' />
                          <input type='hidden' name='itemId' value={item.id} />
                          <input type='hidden' name='status' value='ready' />
                          <button
                            type='submit'
                            className='text-xs text-gray-400 hover:text-green-400'
                          >
                            ✓
                          </button>
                        </form>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
