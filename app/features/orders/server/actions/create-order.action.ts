import { requireAuth } from '~/server/auth/session.server'
import { createOrderSchema } from '../../schemas'
import { ordersRepository } from '../repository'

export async function createOrderAction(request: Request) {
  const session = await requireAuth(request)
  const organizationId = session.session.activeOrganizationId

  if (!organizationId) {
    return { success: false, message: 'No active organization' }
  }

  const formData = await request.formData()

  const rawDetails = formData.get('details')
  const rawRecipients = formData.get('recipients')

  let details: unknown[] = []
  let recipients: unknown[] = []

  try {
    details = rawDetails ? JSON.parse(rawDetails as string) : []
    recipients = rawRecipients ? JSON.parse(rawRecipients as string) : []
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
    recipients: recipients.length > 0 ? recipients : undefined,
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
      message: error instanceof Error ? error.message : 'Failed to create order',
    }
  }
}
