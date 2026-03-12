import { beforeEach, describe, expect, test, vi } from 'vitest'

vi.mock('~/features/pos/server/repository/tables.repository', () => ({
  posTablesRepository: {
    getTableById: vi.fn(),
    getActiveOrderForTable: vi.fn(),
    updateTableStatus: vi.fn(),
  },
}))

vi.mock('~/server/db', () => ({
  db: {
    insert: vi.fn(),
    transaction: vi.fn(),
  },
}))

vi.mock('~/server/db/schemas/pos', () => ({
  posSaleModel: {},
}))

import { posTablesRepository } from '~/features/pos/server/repository/tables.repository'
import { openTableOrderAction } from './open-table-order.action'

const mockRepo = vi.mocked(posTablesRepository)

const makeInput = (overrides = {}) => ({
  tableId: 'table-1',
  organizationId: 'org-1',
  sucursalId: 'suc-1',
  terminalId: 'term-1',
  cashierId: 'cashier-1',
  sessionId: 'session-1',
  businessPartnerId: 'bp-1',
  coverCount: 2,
  ...overrides,
})

describe('openTableOrderAction', () => {
  beforeEach(() => vi.clearAllMocks())

  test('throws if table not found', async () => {
    mockRepo.getTableById.mockResolvedValue(null as never)

    await expect(openTableOrderAction(makeInput())).rejects.toThrow('Table not found')
  })

  test('throws if table already has an open order', async () => {
    mockRepo.getTableById.mockResolvedValue({ id: 'table-1', status: 'available' } as never)
    mockRepo.getActiveOrderForTable.mockResolvedValue({ id: 'sale-existing', status: 'open' } as never)

    await expect(openTableOrderAction(makeInput())).rejects.toThrow('Table already has an open order')
  })

  test('creates open sale and marks table as occupied', async () => {
    const table = { id: 'table-1', number: '1', status: 'available' }
    const newSale = { id: 'sale-1', status: 'open', tableId: 'table-1' }

    mockRepo.getTableById.mockResolvedValue(table as never)
    mockRepo.getActiveOrderForTable.mockResolvedValue(null as never)
    mockRepo.updateTableStatus.mockResolvedValue({ ...table, status: 'occupied' } as never)

    const { db } = await import('~/server/db')
    ;(db.transaction as ReturnType<typeof vi.fn>).mockImplementation(
      async (fn: (tx: unknown) => Promise<unknown>) => fn({ insert: vi.fn().mockReturnValue({ values: vi.fn().mockReturnValue({ returning: vi.fn().mockResolvedValue([newSale]) }) }) })
    )

    const result = await openTableOrderAction(makeInput())

    expect(result).toEqual(newSale)
    expect(mockRepo.updateTableStatus).toHaveBeenCalledWith('table-1', 'occupied')
  })
})
