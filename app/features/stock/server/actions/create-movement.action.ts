import { requireAuth } from '~/server/auth/session.server'
import { createStockMovementSchema } from '../../schemas'
import { stockMovementRepository } from '../repository'

export async function createStockMovement(request: Request) {
  const session = await requireAuth(request)
  const organizationId = session.session.activeOrganizationId
  const userId = session.user.id

  if (!organizationId) {
    return { success: false, message: 'No active organization selected' }
  }

  const formData = await request.formData()
  const inputValues = {
    productId: formData.get('productId'),
    type: formData.get('type'),
    quantity: Number(formData.get('quantity')),
    reason: formData.get('reason'),
    notes: formData.get('notes') || null,
    movementDate: formData.get('movementDate')
      ? new Date(formData.get('movementDate') as string)
      : new Date(),
    referenceType: 'manual',
    referenceId: null,
    createdById: userId,
    organizationId,
  }

  const result = createStockMovementSchema.safeParse(inputValues)
  if (!result.success) {
    return {
      success: false,
      message: 'Validation failed',
      errors: result.error.flatten().fieldErrors,
    }
  }

  try {
    const movement = await stockMovementRepository.create(result.data)
    return { success: true, data: movement }
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : 'Failed to create stock movement',
    }
  }
}
