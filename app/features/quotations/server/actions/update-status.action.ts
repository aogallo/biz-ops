import { requireAuth } from '~/server/auth/session.server'
import { quotationsRepository } from '../repository'

type QuotationStatus = 'DRAFT' | 'SENT' | 'ACCEPTED' | 'REJECTED'

const validTransitions: Record<QuotationStatus, QuotationStatus[]> = {
  DRAFT: ['SENT'],
  SENT: ['ACCEPTED', 'REJECTED'],
  ACCEPTED: [],
  REJECTED: [],
}

export async function updateQuotationStatusAction(
  request: Request,
  quotationId: string
) {
  const session = await requireAuth(request)
  const organizationId = session.session.activeOrganizationId

  if (!organizationId) {
    return { success: false, message: 'No active organization' }
  }

  const formData = await request.formData()
  const newStatus = formData.get('status') as QuotationStatus

  if (
    !newStatus ||
    !['DRAFT', 'SENT', 'ACCEPTED', 'REJECTED'].includes(newStatus)
  ) {
    return { success: false, message: 'Invalid status' }
  }

  const quotation = await quotationsRepository.getById(quotationId)
  if (!quotation) {
    return { success: false, message: 'Quotation not found' }
  }

  if (quotation.organizationId !== organizationId) {
    return { success: false, message: 'Permission denied' }
  }

  const currentStatus = quotation.status as QuotationStatus
  const allowed = validTransitions[currentStatus]
  if (!allowed.includes(newStatus)) {
    return {
      success: false,
      message: `Cannot transition from ${currentStatus} to ${newStatus}`,
    }
  }

  try {
    const updated = await quotationsRepository.updateStatus(
      quotationId,
      newStatus
    )
    return { success: true, data: updated }
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error ? error.message : 'Failed to update status',
    }
  }
}
