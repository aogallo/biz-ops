import { beforeEach, describe, expect, test, vi } from 'vitest'

vi.mock('~/server/db', () => ({
  db: { select: vi.fn(), insert: vi.fn(), update: vi.fn(), delete: vi.fn() },
}))

vi.mock('~/server/db/schemas/pos', () => ({
  posTableModel: {
    id: 'id',
    organizationId: 'organization_id',
    sucursalId: 'sucursal_id',
    status: 'status',
    isActive: 'is_active',
  },
  posSaleModel: {
    tableId: 'table_id',
    status: 'status',
  },
}))

vi.mock('drizzle-orm', () => ({
  and: vi.fn((...args) => args),
  eq: vi.fn((col, val) => ({ col, val })),
  desc: vi.fn((col) => col),
}))

import { db } from '~/server/db'
import { PosTablesRepository } from './tables.repository'

const mockDb = vi.mocked(db)

const makeSelectChain = (resolved: unknown) => {
  const c = { from: vi.fn(), where: vi.fn(), orderBy: vi.fn(), limit: vi.fn() }
  c.from.mockReturnValue(c)
  c.orderBy.mockReturnValue(c)
  c.limit.mockResolvedValue(resolved)
  c.where.mockResolvedValue(resolved)
  return c
}

const makeMutationChain = (resolved: unknown) => {
  const c = {
    set: vi.fn(),
    values: vi.fn(),
    where: vi.fn(),
    returning: vi.fn(),
  }
  c.set.mockReturnValue(c)
  c.values.mockReturnValue(c)
  c.where.mockReturnValue(c)
  c.returning.mockResolvedValue(resolved)
  return c
}

describe('PosTablesRepository', () => {
  let repo: PosTablesRepository

  beforeEach(() => {
    repo = new PosTablesRepository()
    vi.clearAllMocks()
  })

  describe('getTables', () => {
    test('returns all active tables for an org', async () => {
      const tables = [{ id: 't1', number: '1', status: 'available' }]
      ;(mockDb.select as ReturnType<typeof vi.fn>).mockReturnValue(
        makeSelectChain(tables)
      )

      const result = await repo.getTables('org-1')

      expect(result).toEqual(tables)
    })
  })

  describe('createTable', () => {
    test('inserts and returns new table', async () => {
      const table = { id: 't1', number: '1', organizationId: 'org-1' }
      ;(mockDb.insert as ReturnType<typeof vi.fn>).mockReturnValue(
        makeMutationChain([table])
      )

      const result = await repo.createTable({
        organizationId: 'org-1',
        number: '1',
      })

      expect(result).toEqual(table)
    })
  })

  describe('updateTableStatus', () => {
    test('updates status of a table', async () => {
      const updated = { id: 't1', status: 'occupied' }
      ;(mockDb.update as ReturnType<typeof vi.fn>).mockReturnValue(
        makeMutationChain([updated])
      )

      const result = await repo.updateTableStatus('t1', 'occupied')

      expect(result).toEqual(updated)
    })
  })

  describe('getActiveOrderForTable', () => {
    test('returns the open sale for a table', async () => {
      const sale = { id: 's1', tableId: 't1', status: 'open' }
      ;(mockDb.select as ReturnType<typeof vi.fn>).mockReturnValue(
        makeSelectChain([sale])
      )

      const result = await repo.getActiveOrderForTable('t1')

      expect(result).toEqual(sale)
    })

    test('returns null if no open sale', async () => {
      ;(mockDb.select as ReturnType<typeof vi.fn>).mockReturnValue(
        makeSelectChain([])
      )

      const result = await repo.getActiveOrderForTable('t1')

      expect(result).toBeNull()
    })
  })
})
