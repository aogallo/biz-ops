import { requireAuth } from '~/server/auth/session.server'
import { requirePermission } from '~/server/auth/permissions.server'
import { createOrderSchema } from '../../schemas'
import { ordersRepository } from '../repository'

export async function createOrderAction(request: Request) {
  const session = await requireAuth(request)
  const organizationId = session.session.activeOrganizationId

  if (!organizationId) {
    return { success: false, message: 'No active organization' }
  }

  await requirePermission(session.user.id, organizationId, 'order:create')

  const formData = await request.formData()

  const rawDetails = formData.get('details')

  let details: unknown[] = []

  try {
    details = rawDetails ? JSON.parse(rawDetails as string) : []
  } catch {
    return { success: false, message: 'Invalid JSON data' }
  }

  const inputValues = {
    organizationId,
    companyId: formData.get('companyId'),
    businessPartnerId: formData.get('businessPartnerId'),
    orderDate: formData.get('orderDate'),
    currencyCode: (formData.get('currencyCode') as string) || 'GT',
    details,
  }

  const result = createOrderSchema.safeParse(inputValues)
  if (!result.success) {
    return {
      success: false,
      message: 'Validation failed',
      errors: result.error.flatten().fieldErrors,
    }
  }

  try {
    const order = await ordersRepository.create(result.data)
    return { success: true, data: order }
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error ? error.message : 'Failed to create order',
    }
  }
}
