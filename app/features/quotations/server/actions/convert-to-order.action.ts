import { requireAuth } from '~/server/auth/session.server'
import { quotationsRepository } from '../repository'
import { ordersRepository } from '~/features/orders/server/repository'
import type { CreateOrderInput } from '~/features/orders/schemas'

export async function convertToOrderAction(
  request: Request,
  quotationId: string
) {
  const session = await requireAuth(request)
  const organizationId = session.session.activeOrganizationId

  if (!organizationId) {
    return { success: false, message: 'No active organization' }
  }

  const quotation = await quotationsRepository.getById(quotationId)
  if (!quotation) {
    return { success: false, message: 'Quotation not found' }
  }

  if (quotation.organizationId !== organizationId) {
    return { success: false, message: 'Permission denied' }
  }

  if (quotation.status !== 'ACCEPTED') {
    return {
      success: false,
      message: 'Only accepted quotations can be converted to orders',
    }
  }

  if (quotation.convertedOrderId) {
    return {
      success: false,
      message: 'This quotation has already been converted to an order',
    }
  }

  try {
    const orderInput: CreateOrderInput = {
      organizationId: quotation.organizationId,
      companyId: quotation.companyId,
      businessPartnerId: quotation.businessPartnerId,
      orderDate: new Date().toISOString().split('T')[0],
      currencyCode: quotation.currencyCode ?? 'GT',
      details: quotation.details.map((d) => ({
        productId: d.productId,
        productName: d.productName,
        productSku: d.productSku ?? null,
        quantity: d.quantity,
        unitPrice: d.unitPrice,
        sourceType: d.sourceType,
        customAttributesJson: d.customAttributesJson as Record<
          string,
          unknown
        > | null,
        recipients: d.recipients.map((r) => ({
          name: r.name,
          metadataJson: r.metadataJson as Record<string, unknown> | null,
        })),
      })),
    }

    const order = await ordersRepository.create(orderInput)

    await quotationsRepository.setConvertedOrderId(quotationId, order.id)

    return { success: true, data: order }
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : 'Failed to convert quotation to order',
    }
  }
}
