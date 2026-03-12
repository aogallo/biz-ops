import { beforeEach, describe, expect, test, vi } from 'vitest'

vi.mock('~/features/pos/server/repository/tables.repository', () => ({
  posTablesRepository: {
    getActiveOrderForTable: vi.fn(),
    updateTableStatus: vi.fn(),
  },
}))

vi.mock('~/server/db', () => ({
  db: { transaction: vi.fn() },
}))

vi.mock('~/server/db/schemas/pos', () => ({
  posSaleModel: {},
  posPaymentModel: {},
}))

import { posTablesRepository } from '~/features/pos/server/repository/tables.repository'
import { closeTableOrderAction } from './close-table-order.action'

const mockRepo = vi.mocked(posTablesRepository)

const makeInput = (overrides = {}) => ({
  tableId: 'table-1',
  saleNumber: 'T001-000001',
  payments: [{ method: 'cash' as const, amount: '150.00', receivedAmount: '200.00', changeAmount: '50.00' }],
  subtotal: '133.93',
  ivaAmount: '16.07',
  total: '150.00',
  ...overrides,
})

describe('closeTableOrderAction', () => {
  beforeEach(() => vi.clearAllMocks())

  test('throws if no open order on table', async () => {
    mockRepo.getActiveOrderForTable.mockResolvedValue(null)

    await expect(closeTableOrderAction(makeInput())).rejects.toThrow('No open order found for this table')
  })

  test('closes sale, inserts payment and marks table available', async () => {
    const openSale = { id: 'sale-1', status: 'open', tableId: 'table-1' }
    const closedSale = { ...openSale, status: 'completed' }

    mockRepo.getActiveOrderForTable.mockResolvedValue(openSale)
    mockRepo.updateTableStatus.mockResolvedValue({ id: 'table-1', status: 'available' })

    const { db } = await import('~/server/db')
    ;(db.transaction as ReturnType<typeof vi.fn>).mockImplementation(
      async (fn: (tx: unknown) => Promise<unknown>) => {
        const tx = {
          update: vi.fn().mockReturnValue({ set: vi.fn().mockReturnValue({ where: vi.fn().mockReturnValue({ returning: vi.fn().mockResolvedValue([closedSale]) }) }) }),
          insert: vi.fn().mockReturnValue({ values: vi.fn().mockResolvedValue([]) }),
        }
        return fn(tx)
      }
    )

    const result = await closeTableOrderAction(makeInput())

    expect(result).toEqual(closedSale)
    expect(mockRepo.updateTableStatus).toHaveBeenCalledWith('table-1', 'available')
  })
})
