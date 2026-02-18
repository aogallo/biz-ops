import { requireAuth } from '~/server/auth/session.server'
import { ordersRepository } from '../repository'

type OrderStatus = 'DRAFT' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED'

const validTransitions: Record<OrderStatus, OrderStatus[]> = {
  DRAFT: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['COMPLETED', 'CANCELLED'],
  COMPLETED: [],
  CANCELLED: [],
}

export async function updateOrderStatusAction(
  request: Request,
  orderId: string
) {
  const session = await requireAuth(request)
  const organizationId = session.session.activeOrganizationId

  if (!organizationId) {
    return { success: false, message: 'No active organization' }
  }

  const formData = await request.formData()
  const newStatus = formData.get('status') as OrderStatus

  if (!newStatus || !['DRAFT', 'CONFIRMED', 'COMPLETED', 'CANCELLED'].includes(newStatus)) {
    return { success: false, message: 'Invalid status' }
  }

  const order = await ordersRepository.getById(orderId)
  if (!order) {
    return { success: false, message: 'Order not found' }
  }

  if (order.organizationId !== organizationId) {
    return { success: false, message: 'Permission denied' }
  }

  const currentStatus = order.status as OrderStatus
  const allowed = validTransitions[currentStatus]
  if (!allowed.includes(newStatus)) {
    return {
      success: false,
      message: `Cannot transition from ${currentStatus} to ${newStatus}`,
    }
  }

  try {
    const updated = await ordersRepository.updateStatus(orderId, newStatus)
    return { success: true, data: updated }
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error ? error.message : 'Failed to update status',
    }
  }
}
