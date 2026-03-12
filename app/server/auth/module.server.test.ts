import { beforeEach, describe, expect, test, vi } from 'vitest'

vi.mock('~/server/auth/session.server', () => ({
  requireAuth: vi.fn(),
}))

vi.mock('~/server/permissions', () => ({
  isSuperAdmin: vi.fn(),
}))

vi.mock('~/features/modules/server/repository', () => ({
  modulesRepository: {
    getMemberAccessLevel: vi.fn(),
  },
}))

vi.mock('~/server/db', () => ({
  db: {
    select: vi.fn(),
  },
}))

vi.mock('~/server/db/schemas/auth', () => ({
  memberModel: { id: 'id', organizationId: 'organization_id', userId: 'user_id' },
}))

vi.mock('drizzle-orm', () => ({
  and: vi.fn((...args) => args),
  eq: vi.fn((col, val) => ({ col, val })),
}))

import { requireAuth } from '~/server/auth/session.server'
import { modulesRepository } from '~/features/modules/server/repository'
import { db } from '~/server/db'
import { requireModule } from './module.server'

const mockRequireAuth = vi.mocked(requireAuth)
const mockGetMemberAccessLevel = vi.mocked(modulesRepository.getMemberAccessLevel)
const mockDb = vi.mocked(db)

const makeRequest = () => new Request('http://localhost/pos')

const makeSession = (overrides?: { isSuperAdmin?: boolean; activeOrganizationId?: string | null }) => {
  const orgId: string | null = overrides && 'activeOrganizationId' in overrides
    ? (overrides.activeOrganizationId ?? null)
    : 'org-1'
  return {
    session: {
      userId: 'user-1',
      token: 'token',
      expiresAt: new Date(),
      activeOrganizationId: orgId,
    },
    user: {
      id: 'user-1',
      email: 'test@test.com',
      emailVerified: true,
      name: 'Test User',
      image: null,
      isSuperAdmin: overrides?.isSuperAdmin ?? false,
    },
  }
}

const makeSelectChain = (resolvedValue: unknown) => {
  const chain = { from: vi.fn(), where: vi.fn(), limit: vi.fn() }
  chain.from.mockReturnValue(chain)
  chain.where.mockReturnValue(chain)
  chain.limit.mockResolvedValue(resolvedValue)
  return chain
}

describe('requireModule', () => {
  beforeEach(() => vi.clearAllMocks())

  test('super admin bypasses module check and returns session', async () => {
    const session = makeSession({ isSuperAdmin: true })
    mockRequireAuth.mockResolvedValue(session)

    const result = await requireModule(makeRequest(), 'pos')

    expect(result).toEqual(session)
    expect(mockGetMemberAccessLevel).not.toHaveBeenCalled()
  })

  test('redirects when org has no active organization', async () => {
    mockRequireAuth.mockResolvedValue(makeSession({ activeOrganizationId: null }))

    await expect(requireModule(makeRequest(), 'pos')).rejects.toBeInstanceOf(Response)
  })

  test('redirects when member has no access to module', async () => {
    mockRequireAuth.mockResolvedValue(makeSession())
    ;(mockDb.select as ReturnType<typeof vi.fn>).mockReturnValue(
      makeSelectChain([{ id: 'member-1' }])
    )
    mockGetMemberAccessLevel.mockResolvedValue('none')

    await expect(requireModule(makeRequest(), 'pos')).rejects.toBeInstanceOf(Response)
  })

  test('allows access when member has user access and returns session', async () => {
    const session = makeSession()
    mockRequireAuth.mockResolvedValue(session)
    ;(mockDb.select as ReturnType<typeof vi.fn>).mockReturnValue(
      makeSelectChain([{ id: 'member-1' }])
    )
    mockGetMemberAccessLevel.mockResolvedValue('user')

    const result = await requireModule(makeRequest(), 'pos')
    expect(result).toEqual(session)
  })

  test('allows access when member has admin access and returns session', async () => {
    const session = makeSession()
    mockRequireAuth.mockResolvedValue(session)
    ;(mockDb.select as ReturnType<typeof vi.fn>).mockReturnValue(
      makeSelectChain([{ id: 'member-1' }])
    )
    mockGetMemberAccessLevel.mockResolvedValue('admin')

    const result = await requireModule(makeRequest(), 'pos')
    expect(result).toEqual(session)
  })

  test('redirects when member record not found', async () => {
    mockRequireAuth.mockResolvedValue(makeSession())
    ;(mockDb.select as ReturnType<typeof vi.fn>).mockReturnValue(
      makeSelectChain([])
    )

    await expect(requireModule(makeRequest(), 'pos')).rejects.toBeInstanceOf(Response)
  })
})
