import { requireAuth } from '~/server/auth/session.server'
import { servicesRepository } from '../repository'

export async function deleteServiceAction(request: Request) {
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

  try {
    // Soft delete - marks as inactive instead of removing
    await servicesRepository.softDelete(id)
    return {
      success: true,
      message: 'Service deleted successfully',
    }
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error ? error.message : 'Failed to delete service',
    }
  }
}
