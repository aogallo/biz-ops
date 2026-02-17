import { getLocaleFromRequest, translateServer } from '~/i18n/translate.server'
import { requireAuth } from '~/server/auth/session.server'
import { businessPartnersRepository } from '../repository'

export async function deleteBusinessPartner(request: Request, partnerId: string) {
  const session = await requireAuth(request)
  const locale = getLocaleFromRequest(request)

  const organizationId = session.session.activeOrganizationId
  if (!organizationId) {
    return {
      success: false,
      message: translateServer(locale, 'messages.partners.noOrganization'),
    }
  }

  const existingPartner = await businessPartnersRepository.getById(partnerId)
  if (!existingPartner) {
    return {
      success: false,
      message: translateServer(locale, 'messages.partners.notFound'),
    }
  }

  if (existingPartner.organizationId !== organizationId) {
    return {
      success: false,
      message: translateServer(locale, 'messages.common.noPermission'),
    }
  }

  try {
    const deleted = await businessPartnersRepository.delete(partnerId)
    if (!deleted) {
      return {
        success: false,
        message: translateServer(locale, 'messages.partners.notFound'),
      }
    }
    return {
      success: true,
      message: translateServer(locale, 'messages.partners.deleted'),
    }
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to delete business partner',
    }
  }
}
