import { beforeEach, describe, expect, test, vi } from 'vitest'

vi.mock('~/server/db', () => ({
  db: {
    update: vi.fn(),
    select: vi.fn(),
    insert: vi.fn(),
  },
}))

vi.mock('~/server/db/schemas/sucursal', () => ({
  sucursalModel: {
    id: 'id',
    invoicePrefix: 'invoice_prefix',
    nextInvoiceNumber: 'next_invoice_number',
    updatedAt: 'updated_at',
    code: 'code',
    isActive: 'is_active',
    kitchenPin: 'kitchen_pin',
    organizationId: 'organization_id',
    name: 'name',
  },
}))

vi.mock('~/server/db/schemas/company', () => ({
  companyModel: { id: 'id', name: 'name' },
}))

vi.mock('drizzle-orm', () => ({
  and: vi.fn((...args) => args),
  eq: vi.fn((col, val) => ({ col, val })),
  sql: Object.assign(
    vi.fn((s: unknown) => s),
    { raw: vi.fn() }
  ),
}))

import { db } from '~/server/db'
import { SucursalRepository } from './sucursal.repository'

const mockDb = vi.mocked(db)

describe('SucursalRepository.getNextInvoiceNumber', () => {
  let repo: SucursalRepository

  beforeEach(() => {
    repo = new SucursalRepository()
    vi.clearAllMocks()
  })

  test('returns prefix, decremented number, and zero-padded formatted string', async () => {
    const mockReturning = vi
      .fn()
      .mockResolvedValue([{ invoicePrefix: 'SUA', nextInvoiceNumber: 2 }])
    const mockWhere = vi.fn().mockReturnValue({ returning: mockReturning })
    const mockSet = vi.fn().mockReturnValue({ where: mockWhere })
    ;(mockDb.update as ReturnType<typeof vi.fn>).mockReturnValue({
      set: mockSet,
    })

    const result = await repo.getNextInvoiceNumber('some-sucursal-id')

    expect(result.prefix).toBe('SUA')
    expect(result.number).toBe(1)
    expect(result.formatted).toBe('SUA-000001')
  })

  test('formats number with 6 zero-padded digits', async () => {
    const mockReturning = vi
      .fn()
      .mockResolvedValue([{ invoicePrefix: 'T01', nextInvoiceNumber: 101 }])
    const mockWhere = vi.fn().mockReturnValue({ returning: mockReturning })
    const mockSet = vi.fn().mockReturnValue({ where: mockWhere })
    ;(mockDb.update as ReturnType<typeof vi.fn>).mockReturnValue({
      set: mockSet,
    })

    const result = await repo.getNextInvoiceNumber('some-sucursal-id')

    expect(result.number).toBe(100)
    expect(result.formatted).toBe('T01-000100')
  })

  test('throws when sucursal not found', async () => {
    const mockReturning = vi.fn().mockResolvedValue([])
    const mockWhere = vi.fn().mockReturnValue({ returning: mockReturning })
    const mockSet = vi.fn().mockReturnValue({ where: mockWhere })
    ;(mockDb.update as ReturnType<typeof vi.fn>).mockReturnValue({
      set: mockSet,
    })

    await expect(repo.getNextInvoiceNumber('nonexistent-id')).rejects.toThrow(
      'Sucursal not found'
    )
  })
})

describe('SucursalRepository.verifyKitchenPin', () => {
  let repo: SucursalRepository

  const makeSelectChain = (resolved: unknown) => {
    const c = { from: vi.fn(), where: vi.fn(), limit: vi.fn() }
    c.from.mockReturnValue(c)
    c.where.mockReturnValue(c)
    c.limit.mockResolvedValue(resolved)
    return c
  }

  beforeEach(() => {
    repo = new SucursalRepository()
    vi.clearAllMocks()
  })

  test('returns null when sucursal not found', async () => {
    ;(mockDb.select as ReturnType<typeof vi.fn>).mockReturnValue(
      makeSelectChain([])
    )

    const result = await repo.verifyKitchenPin('SUCURSAL-01', '1234')

    expect(result).toBeNull()
  })

  test('returns null when sucursal has no kitchenPin configured', async () => {
    ;(mockDb.select as ReturnType<typeof vi.fn>).mockReturnValue(
      makeSelectChain([
        {
          id: 'suc-1',
          organizationId: 'org-1',
          name: 'Sucursal 1',
          kitchenPin: null,
        },
      ])
    )

    const result = await repo.verifyKitchenPin('SUCURSAL-01', '1234')

    expect(result).toBeNull()
  })

  test('returns null when PIN does not match', async () => {
    ;(mockDb.select as ReturnType<typeof vi.fn>).mockReturnValue(
      makeSelectChain([
        {
          id: 'suc-1',
          organizationId: 'org-1',
          name: 'Sucursal 1',
          kitchenPin: '9999',
        },
      ])
    )

    const result = await repo.verifyKitchenPin('SUCURSAL-01', '1234')

    expect(result).toBeNull()
  })

  test('returns sucursal info when PIN matches', async () => {
    ;(mockDb.select as ReturnType<typeof vi.fn>).mockReturnValue(
      makeSelectChain([
        {
          id: 'suc-1',
          organizationId: 'org-1',
          name: 'Sucursal 1',
          kitchenPin: '1234',
        },
      ])
    )

    const result = await repo.verifyKitchenPin('SUCURSAL-01', '1234')

    expect(result).toEqual({
      id: 'suc-1',
      organizationId: 'org-1',
      name: 'Sucursal 1',
    })
  })
})
