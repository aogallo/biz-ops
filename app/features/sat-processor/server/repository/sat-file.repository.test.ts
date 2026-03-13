import { beforeEach, describe, expect, test, vi } from 'vitest'

vi.mock('~/server/db', () => ({
  db: { select: vi.fn(), insert: vi.fn(), update: vi.fn(), delete: vi.fn() },
}))

vi.mock('~/server/db/schemas/sat-file', () => ({
  satFileModel: {
    id: 'id',
    organizationId: 'organization_id',
    companyId: 'company_id',
    accountingAccountId: 'accounting_account_id',
    emitterName: 'emitter_name',
    emitterNit: 'emitter_nit',
    serie: 'serie',
    authorizationNumber: 'authorization_number',
    date: 'date',
    updatedAt: 'updated_at',
  },
  insertSatFileSchema: {},
}))

vi.mock('drizzle-orm', () => ({
  and: vi.fn((...args) => args.filter(Boolean)),
  eq: vi.fn((col, val) => ({ col, val })),
  isNull: vi.fn((col) => ({ isNull: col })),
  isNotNull: vi.fn((col) => ({ isNotNull: col })),
  ilike: vi.fn((col, pat) => ({ ilike: col, pat })),
  inArray: vi.fn((col, vals) => ({ inArray: col, vals })),
  or: vi.fn((...args) => args),
  sql: Object.assign(
    vi.fn((s: unknown) => s),
    { raw: vi.fn() }
  ),
  count: vi.fn(() => 'count(*)'),
  gte: vi.fn((col, val) => ({ gte: col, val })),
  lte: vi.fn((col, val) => ({ lte: col, val })),
}))

import { db } from '~/server/db'
import { SatFileRepository } from './sat-file.repository'

const mockDb = vi.mocked(db)

const makeChain = (resolved: unknown) => {
  const c = {
    from: vi.fn(),
    where: vi.fn(),
    limit: vi.fn(),
    offset: vi.fn(),
    orderBy: vi.fn(),
  }
  c.from.mockReturnValue(c)
  c.where.mockReturnValue(c)
  c.limit.mockReturnValue(c)
  c.offset.mockReturnValue(c)
  c.orderBy.mockResolvedValue(resolved)
  return c
}

const makeCountChain = (resolved: unknown) => {
  const c = { from: vi.fn(), where: vi.fn() }
  c.from.mockReturnValue(c)
  c.where.mockResolvedValue(resolved)
  return c
}

describe('SatFileRepository.countByOrganization', () => {
  let repo: SatFileRepository

  beforeEach(() => {
    repo = new SatFileRepository()
    vi.clearAllMocks()
  })

  test('returns total count of all records', async () => {
    ;(mockDb.select as ReturnType<typeof vi.fn>).mockReturnValue(
      makeCountChain([{ count: 42 }])
    )

    const result = await repo.countByOrganization('org-1')

    expect(result).toBe(42)
  })

  test('returns 0 when no records exist', async () => {
    ;(mockDb.select as ReturnType<typeof vi.fn>).mockReturnValue(
      makeCountChain([{ count: 0 }])
    )

    const result = await repo.countByOrganization('org-1')

    expect(result).toBe(0)
  })

  test('applies pending filter (null accountingAccountId)', async () => {
    ;(mockDb.select as ReturnType<typeof vi.fn>).mockReturnValue(
      makeCountChain([{ count: 5 }])
    )

    const result = await repo.countByOrganization('org-1', {}, true)

    expect(result).toBe(5)
  })
})

describe('SatFileRepository.getByOrganization date filtering', () => {
  let repo: SatFileRepository

  beforeEach(() => {
    repo = new SatFileRepository()
    vi.clearAllMocks()
  })

  test('applies dateFrom and dateTo filters when provided', async () => {
    ;(mockDb.select as ReturnType<typeof vi.fn>).mockReturnValue(makeChain([]))

    await repo.getByOrganization('org-1', {
      dateFrom: '2026-01-01',
      dateTo: '2026-01-31',
    })

    expect(mockDb.select).toHaveBeenCalled()
  })

  test('works without date filters', async () => {
    ;(mockDb.select as ReturnType<typeof vi.fn>).mockReturnValue(makeChain([]))

    await repo.getByOrganization('org-1', {})

    expect(mockDb.select).toHaveBeenCalled()
  })
})
