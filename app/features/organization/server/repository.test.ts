import { beforeEach, describe, expect, test, vi } from 'vitest'

vi.mock('~/server/db', () => ({
  db: { select: vi.fn(), insert: vi.fn(), update: vi.fn(), delete: vi.fn() },
}))

vi.mock('~/server/db/schemas/auth', () => ({
  organizationModel: {
    id: 'id',
    name: 'name',
    slug: 'slug',
    isAdmin: 'is_admin',
    createdAt: 'created_at',
  },
  memberModel: { id: 'id', organizationId: 'organization_id' },
}))

vi.mock('~/server/db/schemas/modules', () => ({
  organizationModuleModel: {
    organizationId: 'organization_id',
    isActive: 'is_active',
    moduleKey: 'module_key',
  },
}))

vi.mock('drizzle-orm', () => ({
  eq: vi.fn((col, val) => ({ col, val })),
  sql: Object.assign(
    vi.fn((s: unknown) => s),
    { raw: vi.fn() }
  ),
  count: vi.fn(() => 'count(*)'),
  desc: vi.fn((col) => ({ desc: col })),
  and: vi.fn((...args) => args),
  leftJoin: vi.fn(),
}))

import { db } from '~/server/db'
import { OrganizationRepository } from './repository'

const mockDb = vi.mocked(db)

describe('OrganizationRepository.getAllWithStats', () => {
  let repo: OrganizationRepository

  const makeChain = (resolved: unknown) => {
    const c = {
      from: vi.fn(),
      leftJoin: vi.fn(),
      where: vi.fn(),
      groupBy: vi.fn(),
      orderBy: vi.fn(),
    }
    c.from.mockReturnValue(c)
    c.leftJoin.mockReturnValue(c)
    c.where.mockReturnValue(c)
    c.groupBy.mockReturnValue(c)
    c.orderBy.mockResolvedValue(resolved)
    return c
  }

  beforeEach(() => {
    repo = new OrganizationRepository()
    vi.clearAllMocks()
  })

  test('returns all organizations excluding admin orgs', async () => {
    const rows = [
      {
        id: 'org-1',
        name: 'Org 1',
        slug: 'org-1',
        createdAt: new Date(),
        memberCount: 3,
        activeModuleCount: 2,
      },
      {
        id: 'org-2',
        name: 'Org 2',
        slug: 'org-2',
        createdAt: new Date(),
        memberCount: 1,
        activeModuleCount: 0,
      },
    ]

    ;(mockDb.select as ReturnType<typeof vi.fn>).mockReturnValue(
      makeChain(rows)
    )

    const result = await repo.getAllWithStats()

    expect(result).toHaveLength(2)
    expect(result[0].memberCount).toBe(3)
    expect(result[1].activeModuleCount).toBe(0)
  })

  test('returns empty array when no organizations', async () => {
    ;(mockDb.select as ReturnType<typeof vi.fn>).mockReturnValue(makeChain([]))

    const result = await repo.getAllWithStats()

    expect(result).toEqual([])
  })
})
