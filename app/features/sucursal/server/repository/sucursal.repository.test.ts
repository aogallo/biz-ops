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
  },
}))

vi.mock('~/server/db/schemas/company', () => ({
  companyModel: { id: 'id', name: 'name' },
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
    const mockReturning = vi.fn().mockResolvedValue([
      { invoicePrefix: 'SUA', nextInvoiceNumber: 2 },
    ])
    const mockWhere = vi.fn().mockReturnValue({ returning: mockReturning })
    const mockSet = vi.fn().mockReturnValue({ where: mockWhere })
    ;(mockDb.update as ReturnType<typeof vi.fn>).mockReturnValue({ set: mockSet })

    const result = await repo.getNextInvoiceNumber('some-sucursal-id')

    expect(result.prefix).toBe('SUA')
    expect(result.number).toBe(1)
    expect(result.formatted).toBe('SUA-000001')
  })

  test('formats number with 6 zero-padded digits', async () => {
    const mockReturning = vi.fn().mockResolvedValue([
      { invoicePrefix: 'T01', nextInvoiceNumber: 101 },
    ])
    const mockWhere = vi.fn().mockReturnValue({ returning: mockReturning })
    const mockSet = vi.fn().mockReturnValue({ where: mockWhere })
    ;(mockDb.update as ReturnType<typeof vi.fn>).mockReturnValue({ set: mockSet })

    const result = await repo.getNextInvoiceNumber('some-sucursal-id')

    expect(result.number).toBe(100)
    expect(result.formatted).toBe('T01-000100')
  })

  test('throws when sucursal not found', async () => {
    const mockReturning = vi.fn().mockResolvedValue([])
    const mockWhere = vi.fn().mockReturnValue({ returning: mockReturning })
    const mockSet = vi.fn().mockReturnValue({ where: mockWhere })
    ;(mockDb.update as ReturnType<typeof vi.fn>).mockReturnValue({ set: mockSet })

    await expect(repo.getNextInvoiceNumber('nonexistent-id')).rejects.toThrow(
      'Sucursal not found'
    )
  })
})
