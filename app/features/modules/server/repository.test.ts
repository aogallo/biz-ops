import { beforeEach, describe, expect, test, vi } from 'vitest'

vi.mock('~/server/db', () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
  },
}))

vi.mock('~/server/db/schemas/modules', () => ({
  organizationModuleModel: {
    organizationId: 'organization_id',
    moduleKey: 'module_key',
    isActive: 'is_active',
  },
  memberModuleAccessModel: {
    memberId: 'member_id',
    moduleKey: 'module_key',
    accessLevel: 'access_level',
    organizationId: 'organization_id',
  },
}))

vi.mock('~/server/db/schemas/auth', () => ({
  memberModel: {
    id: 'id',
    organizationId: 'organization_id',
    userId: 'user_id',
  },
}))

vi.mock('drizzle-orm', () => ({
  and: vi.fn((...args) => args),
  eq: vi.fn((col, val) => ({ col, val })),
}))

import { db } from '~/server/db'
import { ModulesRepository } from './repository'

const mockDb = vi.mocked(db)

const makeSelectChain = (resolvedValue: unknown) => {
  const chain = {
    from: vi.fn(),
    where: vi.fn(),
    limit: vi.fn(),
  }
  chain.from.mockReturnValue(chain)
  chain.where.mockReturnValue(chain)
  chain.limit.mockResolvedValue(resolvedValue)
  // where also resolves directly for non-limited queries
  chain.where.mockResolvedValue(resolvedValue)
  return chain
}

describe('ModulesRepository.autoGrantMemberAccess', () => {
  let repo: ModulesRepository

  beforeEach(() => {
    repo = new ModulesRepository()
    vi.clearAllMocks()
  })

  test('grants user access to members who have none access', async () => {
    const getMemberAccessLevelSpy = vi
      .spyOn(repo, 'getMemberAccessLevel')
      .mockResolvedValue('none')

    const setMemberModuleAccessSpy = vi
      .spyOn(repo, 'setMemberModuleAccess')
      .mockResolvedValue(undefined)

    // Mock db.select for getting org members
    ;(mockDb.select as ReturnType<typeof vi.fn>).mockReturnValue(
      makeSelectChain([{ id: 'member-1' }, { id: 'member-2' }])
    )

    await repo.autoGrantMemberAccess('org-1', 'pos')

    expect(setMemberModuleAccessSpy).toHaveBeenCalledTimes(2)
    expect(setMemberModuleAccessSpy).toHaveBeenCalledWith(
      'member-1',
      'org-1',
      'pos',
      'user'
    )
    expect(setMemberModuleAccessSpy).toHaveBeenCalledWith(
      'member-2',
      'org-1',
      'pos',
      'user'
    )
    expect(getMemberAccessLevelSpy).toHaveBeenCalledTimes(2)
  })

  test('does not downgrade members who already have admin or user access', async () => {
    vi.spyOn(repo, 'getMemberAccessLevel').mockResolvedValue('admin')

    const setMemberModuleAccessSpy = vi
      .spyOn(repo, 'setMemberModuleAccess')
      .mockResolvedValue(undefined)

    ;(mockDb.select as ReturnType<typeof vi.fn>).mockReturnValue(
      makeSelectChain([{ id: 'member-1' }])
    )

    await repo.autoGrantMemberAccess('org-1', 'pos')

    expect(setMemberModuleAccessSpy).not.toHaveBeenCalled()
  })

  test('does nothing if org has no members', async () => {
    const setMemberModuleAccessSpy = vi
      .spyOn(repo, 'setMemberModuleAccess')
      .mockResolvedValue(undefined)

    ;(mockDb.select as ReturnType<typeof vi.fn>).mockReturnValue(
      makeSelectChain([])
    )

    await repo.autoGrantMemberAccess('org-1', 'pos')

    expect(setMemberModuleAccessSpy).not.toHaveBeenCalled()
  })
})

describe('ModulesRepository.revokeAllMembersAccess', () => {
  let repo: ModulesRepository

  beforeEach(() => {
    repo = new ModulesRepository()
    vi.clearAllMocks()
  })

  test('sets access to none for all org members', async () => {
    const setMemberModuleAccessSpy = vi
      .spyOn(repo, 'setMemberModuleAccess')
      .mockResolvedValue(undefined)

    ;(mockDb.select as ReturnType<typeof vi.fn>).mockReturnValue(
      makeSelectChain([{ id: 'member-1' }, { id: 'member-2' }])
    )

    await repo.revokeAllMembersAccess('org-1', 'pos')

    expect(setMemberModuleAccessSpy).toHaveBeenCalledTimes(2)
    expect(setMemberModuleAccessSpy).toHaveBeenCalledWith(
      'member-1',
      'org-1',
      'pos',
      'none'
    )
    expect(setMemberModuleAccessSpy).toHaveBeenCalledWith(
      'member-2',
      'org-1',
      'pos',
      'none'
    )
  })

  test('does nothing if org has no members', async () => {
    const setMemberModuleAccessSpy = vi
      .spyOn(repo, 'setMemberModuleAccess')
      .mockResolvedValue(undefined)

    ;(mockDb.select as ReturnType<typeof vi.fn>).mockReturnValue(
      makeSelectChain([])
    )

    await repo.revokeAllMembersAccess('org-1', 'pos')

    expect(setMemberModuleAccessSpy).not.toHaveBeenCalled()
  })
})
