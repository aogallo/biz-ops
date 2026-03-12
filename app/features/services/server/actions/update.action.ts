import { requireAuth } from '~/server/auth/session.server'
import { updateServiceSchema } from '../../schemas'
import { servicesRepository } from '../repository'

export async function updateServiceAction(request: Request) {
  const session = await requireAuth(request)

  const organizationId = session.session.activeOrganizationId
  if (!organizationId) {
    return {
      success: false,
      message: 'No active organization selected',
    }
  }

  const formData = await request.formData()
  const id = formData.get('id') as string

  if (!id) {
    return {
      success: false,
      message: 'Service ID is required',
    }
  }

  // Verify service belongs to organization
  const existingService = await servicesRepository.getByIdAndOrganization(
    id,
    organizationId
  )
  if (!existingService) {
    return {
      success: false,
      message: 'Service not found',
    }
  }

  const inputValues = {
    id,
    name: formData.get('name') || undefined,
    duration: formData.get('duration')
      ? Number(formData.get('duration'))
      : undefined,
    color: formData.get('color') || undefined,
    price: formData.get('price') || undefined,
    description: formData.get('description') || undefined,
    isActive: formData.has('isActive')
      ? formData.get('isActive') === 'true'
      : undefined,
    organizationId,
  }

  const result = updateServiceSchema.safeParse(inputValues)
  if (!result.success) {
    return {
      success: false,
      message: 'Validation failed',
      errors: result.error.flatten().fieldErrors,
    }
  }

  try {
    const { id: serviceId, ...updateData } = result.data
    const service = await servicesRepository.update(serviceId, updateData)
    return {
      success: true,
      data: service,
    }
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error ? error.message : 'Failed to update service',
    }
  }
}
