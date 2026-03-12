import { beforeEach, describe, expect, test, vi } from 'vitest'

vi.mock('~/server/db', () => ({
  db: { select: vi.fn(), insert: vi.fn(), update: vi.fn() },
}))

vi.mock('~/server/db/schemas/kitchen', () => ({
  kitchenTicketModel: {
    id: 'id',
    sucursalId: 'sucursal_id',
    status: 'status',
    ticketNumber: 'ticket_number',
    saleId: 'sale_id',
    createdAt: 'created_at',
  },
  kitchenTicketItemModel: { ticketId: 'ticket_id', id: 'id' },
}))

vi.mock('~/server/db/schemas/pos', () => ({
  posSaleModel: { id: 'id', tableId: 'table_id', orderType: 'order_type' },
  posTableModel: { id: 'id', number: 'number' },
}))

vi.mock('drizzle-orm', () => ({
  and: vi.fn((...args) => args),
  eq: vi.fn((col, val) => ({ col, val })),
  inArray: vi.fn((col, vals) => ({ col, vals })),
  sql: vi.fn((s) => s),
  leftJoin: vi.fn(),
}))

import { db } from '~/server/db'
import { KitchenRepository } from './repository'

const mockDb = vi.mocked(db)

// Chain that ends in orderBy (for the main tickets query with joins)
const makeOrderByChain = (resolved: unknown) => {
  const c = {
    from: vi.fn(),
    where: vi.fn(),
    orderBy: vi.fn(),
    leftJoin: vi.fn(),
  }
  c.from.mockReturnValue(c)
  c.leftJoin.mockReturnValue(c)
  c.where.mockReturnValue(c)
  c.orderBy.mockResolvedValue(resolved)
  return c
}

// Chain that ends in where (for the items query)
const makeWhereChain = (resolved: unknown) => {
  const c = { from: vi.fn(), where: vi.fn() }
  c.from.mockReturnValue(c)
  c.where.mockResolvedValue(resolved)
  return c
}

describe('KitchenRepository.getOpenTickets', () => {
  let repo: KitchenRepository

  beforeEach(() => {
    repo = new KitchenRepository()
    vi.clearAllMocks()
  })

  test('returns empty array when no tickets', async () => {
    ;(mockDb.select as ReturnType<typeof vi.fn>).mockReturnValue(
      makeOrderByChain([])
    )

    const result = await repo.getOpenTickets('suc-1')

    expect(result).toEqual([])
  })

  test('includes pending, in_progress and ready tickets', async () => {
    const tickets = [
      {
        id: 't1',
        status: 'pending',
        ticketNumber: 1,
        saleId: null,
        tableNumber: null,
        orderType: null,
        sucursalId: 'suc-1',
        organizationId: 'org-1',
        notes: null,
        createdAt: new Date(),
      },
      {
        id: 't2',
        status: 'in_progress',
        ticketNumber: 2,
        saleId: null,
        tableNumber: null,
        orderType: null,
        sucursalId: 'suc-1',
        organizationId: 'org-1',
        notes: null,
        createdAt: new Date(),
      },
      {
        id: 't3',
        status: 'ready',
        ticketNumber: 3,
        saleId: null,
        tableNumber: null,
        orderType: null,
        sucursalId: 'suc-1',
        organizationId: 'org-1',
        notes: null,
        createdAt: new Date(),
      },
    ]

    let callCount = 0
    ;(mockDb.select as ReturnType<typeof vi.fn>).mockImplementation(() => {
      callCount++
      return callCount === 1 ? makeOrderByChain(tickets) : makeWhereChain([])
    })

    const result = await repo.getOpenTickets('suc-1')

    expect(result).toHaveLength(3)
    expect(result.map((t) => t.status)).toEqual([
      'pending',
      'in_progress',
      'ready',
    ])
  })

  test('maps table number from joined sale', async () => {
    const tickets = [
      {
        id: 't1',
        status: 'pending',
        ticketNumber: 1,
        saleId: 's1',
        tableNumber: '5',
        orderType: 'dine_in',
        sucursalId: 'suc-1',
        organizationId: 'org-1',
        notes: null,
        createdAt: new Date(),
      },
    ]

    let callCount = 0
    ;(mockDb.select as ReturnType<typeof vi.fn>).mockImplementation(() => {
      callCount++
      return callCount === 1 ? makeOrderByChain(tickets) : makeWhereChain([])
    })

    const result = await repo.getOpenTickets('suc-1')

    expect(result[0].tableNumber).toBe('5')
    expect(result[0].orderType).toBe('dine_in')
  })
})
