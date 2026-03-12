import { beforeEach, describe, expect, test, vi } from 'vitest'
import { createOrganization } from './create.action'

vi.mock('~/features/organization/server/repository', () => ({
  organizationRepository: {
    getBySlug: vi.fn(),
  },
}))

vi.mock('~/server/auth-server', () => ({
  default: {
    api: {
      createOrganization: vi.fn(),
    },
  },
}))

import { organizationRepository } from '~/features/organization/server/repository'
import auth from '~/server/auth-server'

const mockRepo = vi.mocked(organizationRepository)
const mockAuth = vi.mocked(auth)

describe('createOrganization action', () => {
  const makeRequest = () => new Request('http://localhost/organization/new')

  const makeFormData = (overrides: Record<string, string> = {}) => {
    const fd = new FormData()
    fd.set('name', overrides.name ?? 'Acme Corp')
    fd.set('slug', overrides.slug ?? 'acme-corp')
    return fd
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('returns error when slug already exists', async () => {
    mockRepo.getBySlug.mockResolvedValue({
      id: 'existing-id',
      name: 'Acme Corp',
      slug: 'acme-corp',
      createdAt: new Date(),
      updatedAt: new Date(),
      logo: null,
      metadata: null,
      domain: null,
      isAdmin: false,
    })

    const result = await createOrganization(makeRequest(), makeFormData())

    expect(result.success).toBe(false)
    expect(result.message).toBe('The organization already exists.')
  })

  test('creates organization when slug is available', async () => {
    mockRepo.getBySlug.mockResolvedValue(null)
    vi.mocked(
      mockAuth.api.createOrganization as unknown as ReturnType<typeof vi.fn>
    ).mockResolvedValue({
      id: 'new-org-id',
      name: 'Acme Corp',
      slug: 'acme-corp',
    })

    const result = await createOrganization(makeRequest(), makeFormData())

    expect(result.success).toBe(true)
    expect(mockAuth.api.createOrganization).toHaveBeenCalledOnce()
  })

  test('returns validation errors for invalid input', async () => {
    const fd = new FormData()
    // name and slug are omitted to trigger validation failure
    const result = await createOrganization(makeRequest(), fd)

    expect(result.success).toBe(false)
    expect(result.message).toBe('There are errors')
  })
})
