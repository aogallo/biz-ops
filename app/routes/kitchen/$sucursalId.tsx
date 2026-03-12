import { useRevalidator } from 'react-router'
import { useEffect, useState } from 'react'
import { kitchenRepository } from '~/features/kitchen/server/repository'
import {
  updateTicketStatusAction,
  updateItemStatusAction,
} from '~/features/kitchen/server/actions/update-ticket-status.action'
import {
  updateTicketStatusSchema,
  updateItemStatusSchema,
} from '~/features/kitchen/schemas'
import { cn } from '~/lib/utils'
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

// ── Elapsed time hook ────────────────────────────────────────────────────────
function useElapsed(createdAt: Date | string | null) {
  const [elapsed, setElapsed] = useState('')

  useEffect(() => {
    if (!createdAt) return
    const update = () => {
      const diff = Math.floor(
        (Date.now() - new Date(createdAt).getTime()) / 1000
      )
      if (diff < 60) setElapsed(`${diff}s`)
      else if (diff < 3600)
        setElapsed(`${Math.floor(diff / 60)}m ${diff % 60}s`)
      else
        setElapsed(
          `${Math.floor(diff / 3600)}h ${Math.floor((diff % 3600) / 60)}m`
        )
    }
    update()
    const id = setInterval(update, 1000)
    return () => clearInterval(id)
  }, [createdAt])

  return elapsed
}

// ── Ticket card ──────────────────────────────────────────────────────────────
type Modification = { type: string; name: string }

interface TicketCardProps {
  ticket: {
    id: string
    ticketNumber: number
    notes: string | null
    createdAt: Date | string | null
    tableNumber: string | null
    orderType: string | null
    status: string
    items: Array<{
      id: string
      productName: string
      quantity: string
      status: string
      modificationsJson: unknown
    }>
  }
  sucursalId: string
  nextStatus: string
  nextLabel: string
  accentClass: string
  borderClass: string
  bgClass: string
}

function TicketCard({
  ticket,
  sucursalId,
  nextStatus,
  nextLabel,
  accentClass,
  borderClass,
  bgClass,
}: TicketCardProps) {
  const elapsed = useElapsed(ticket.createdAt)
  const allItemsDone = ticket.items.every((i) => i.status === 'ready')
  const elapsedSecs = ticket.createdAt
    ? Math.floor((Date.now() - new Date(ticket.createdAt).getTime()) / 1000)
    : 0

  return (
    <div
      className={cn('space-y-3 rounded-xl border-2 p-4', borderClass, bgClass)}
    >
      {/* Header */}
      <div className='flex items-start justify-between gap-2'>
        <div>
          <span className={cn('text-2xl font-bold', accentClass)}>
            #{ticket.ticketNumber}
          </span>
          <div className='mt-0.5 flex items-center gap-2'>
            {ticket.tableNumber ? (
              <span className='rounded-full bg-white/10 px-2 py-0.5 text-xs font-medium'>
                Mesa {ticket.tableNumber}
              </span>
            ) : (
              <span className='text-xs text-gray-400'>Para llevar</span>
            )}
            {elapsed && (
              <span
                className={cn(
                  'text-xs tabular-nums',
                  elapsedSecs > 600 ? 'font-bold text-red-400' : 'text-gray-400'
                )}
              >
                {elapsed}
              </span>
            )}
          </div>
        </div>

        <form method='post' action={`/kitchen/${sucursalId}`}>
          <input type='hidden' name='intent' value='update-ticket' />
          <input type='hidden' name='ticketId' value={ticket.id} />
          <input type='hidden' name='status' value={nextStatus} />
          <button
            type='submit'
            disabled={nextStatus === 'ready' && !allItemsDone}
            className={cn(
              'rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors',
              nextStatus === 'in_progress' &&
                'bg-yellow-500 text-black hover:bg-yellow-400',
              nextStatus === 'ready' &&
                'bg-green-500 text-white hover:bg-green-400 disabled:cursor-not-allowed disabled:opacity-40',
              nextStatus === 'served' &&
                'bg-gray-500 text-white hover:bg-gray-400'
            )}
          >
            {nextLabel}
          </button>
        </form>
      </div>

      {/* Notes */}
      {ticket.notes && (
        <p className='border-l-2 border-gray-600 pl-2 text-xs text-gray-300 italic'>
          {ticket.notes}
        </p>
      )}

      {/* Items */}
      <ul className='space-y-2'>
        {ticket.items.map((item) => {
          const mods = Array.isArray(item.modificationsJson)
            ? (item.modificationsJson as Modification[])
            : []
          const removals = mods.filter((m) => m.type === 'remove')
          const isDone = item.status === 'ready'

          return (
            <li key={item.id} className='space-y-0.5'>
              <div className='flex items-center gap-2'>
                {ticket.status === 'in_progress' && !isDone && (
                  <form method='post' action={`/kitchen/${sucursalId}`}>
                    <input type='hidden' name='intent' value='update-item' />
                    <input type='hidden' name='itemId' value={item.id} />
                    <input type='hidden' name='status' value='ready' />
                    <button
                      type='submit'
                      className='flex size-5 flex-shrink-0 items-center justify-center rounded border border-gray-500 text-xs hover:border-green-400 hover:text-green-400'
                    >
                      ✓
                    </button>
                  </form>
                )}
                {isDone && (
                  <span className='flex size-5 flex-shrink-0 items-center justify-center text-green-400'>
                    ✓
                  </span>
                )}
                <span
                  className={cn(
                    'text-sm',
                    isDone && 'text-gray-500 line-through'
                  )}
                >
                  <span className='text-base font-bold'>{item.quantity}×</span>{' '}
                  {item.productName}
                </span>
              </div>
              {removals.length > 0 && (
                <ul className='ml-7 space-y-0.5'>
                  {removals.map((r, idx) => (
                    <li key={idx} className='text-xs text-red-400'>
                      — Sin {r.name}
                    </li>
                  ))}
                </ul>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}

// ── Column config ────────────────────────────────────────────────────────────
const COLUMNS = [
  {
    status: 'pending' as const,
    label: 'Pendientes',
    labelClass: 'text-yellow-400',
    emptyText: 'Sin pedidos pendientes',
    nextStatus: 'in_progress',
    nextLabel: 'Iniciar',
    accentClass: 'text-yellow-400',
    borderClass: 'border-yellow-500/40',
    bgClass: 'bg-yellow-950/20',
  },
  {
    status: 'in_progress' as const,
    label: 'En proceso',
    labelClass: 'text-blue-400',
    emptyText: 'Nada en proceso',
    nextStatus: 'ready',
    nextLabel: 'Listo',
    accentClass: 'text-blue-400',
    borderClass: 'border-blue-500/40',
    bgClass: 'bg-blue-950/20',
  },
  {
    status: 'ready' as const,
    label: 'Listo para servir',
    labelClass: 'text-green-400',
    emptyText: 'Nada esperando servicio',
    nextStatus: 'served',
    nextLabel: 'Servido',
    accentClass: 'text-green-400',
    borderClass: 'border-green-500/40',
    bgClass: 'bg-green-950/20',
  },
]

// ── Main page ────────────────────────────────────────────────────────────────
export default function KitchenDisplay({ loaderData }: Route.ComponentProps) {
  const { tickets, sucursalId } = loaderData
  const { revalidate } = useRevalidator()

  useEffect(() => {
    const id = setInterval(() => revalidate(), 5000)
    return () => clearInterval(id)
  }, [revalidate])

  const total = tickets.length

  return (
    <div className='flex h-screen flex-col bg-gray-950 text-white'>
      <div className='flex items-center justify-between border-b border-gray-800 px-6 py-3'>
        <h1 className='text-xl font-bold tracking-tight'>Cocina</h1>
        <div className='flex items-center gap-3 text-sm text-gray-400'>
          <span>
            {total} pedido{total !== 1 ? 's' : ''} activo
            {total !== 1 ? 's' : ''}
          </span>
          <span className='size-2 animate-pulse rounded-full bg-green-500' />
        </div>
      </div>

      <div className='flex flex-1 divide-x divide-gray-800 overflow-hidden'>
        {COLUMNS.map((col) => {
          const colTickets = tickets.filter((t) => t.status === col.status)
          return (
            <div key={col.status} className='flex min-w-0 flex-1 flex-col'>
              <div className='flex items-center justify-between border-b border-gray-800 px-4 py-2'>
                <h2 className={cn('font-semibold', col.labelClass)}>
                  {col.label}
                </h2>
                <span className='text-xs text-gray-500'>
                  {colTickets.length}
                </span>
              </div>
              <div className='flex-1 space-y-3 overflow-y-auto p-3'>
                {colTickets.length === 0 ? (
                  <p className='mt-8 text-center text-xs text-gray-600'>
                    {col.emptyText}
                  </p>
                ) : (
                  colTickets.map((ticket) => (
                    <TicketCard
                      key={ticket.id}
                      ticket={ticket}
                      sucursalId={sucursalId}
                      nextStatus={col.nextStatus}
                      nextLabel={col.nextLabel}
                      accentClass={col.accentClass}
                      borderClass={col.borderClass}
                      bgClass={col.bgClass}
                    />
                  ))
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
