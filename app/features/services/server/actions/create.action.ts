import { requireAuth } from '~/server/auth/session.server'
import { createServiceSchema } from '../../schemas'
import { servicesRepository } from '../repository'

export async function createServiceAction(request: Request) {
  const session = await requireAuth(request)

  const organizationId = session.session.activeOrganizationId
  if (!organizationId) {
    return {
      success: false,
      message: 'No active organization selected',
    }
  }

  const formData = await request.formData()
  const inputValues = {
    name: formData.get('name'),
    duration: formData.get('duration') ? Number(formData.get('duration')) : undefined,
    color: formData.get('color'),
    description: formData.get('description') || undefined,
    isActive: formData.get('isActive') !== 'false',
    organizationId,
  }

  const result = createServiceSchema.safeParse(inputValues)
  if (!result.success) {
    return {
      success: false,
      message: 'Validation failed',
      errors: result.error.flatten().fieldErrors,
    }
  }

  try {
    const service = await servicesRepository.create(result.data)
    return {
      success: true,
      data: service,
    }
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to create service',
    }
  }
}
