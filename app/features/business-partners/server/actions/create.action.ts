import { getLocaleFromRequest, translateServer } from '~/i18n/translate.server'
import { requireAuth } from '~/server/auth/session.server'
import { createBusinessPartnerSchema } from '../../schemas'
import { businessPartnersRepository } from '../repository'

export async function createBusinessPartner(request: Request) {
  const session = await requireAuth(request)
  const locale = getLocaleFromRequest(request)

  const organizationId = session.session.activeOrganizationId
  if (!organizationId) {
    return {
      success: false,
      message: translateServer(locale, 'messages.partners.noOrganization'),
    }
  }

  const formData = await request.formData()
  const inputValues = {
    name: formData.get('name'),
    type: formData.get('type'),
    email: formData.get('email') || '',
    phone: formData.get('phone') || '',
    notes: formData.get('notes') || '',
    organizationId,
  }

  const result = createBusinessPartnerSchema.safeParse(inputValues)
  if (!result.success) {
    return {
      success: false,
      message: 'Validation failed',
      errors: result.error.flatten().fieldErrors,
    }
  }

  if (result.data.email) {
    const emailExists = await businessPartnersRepository.existsByEmail(
      organizationId,
      result.data.email,
    )

    if (emailExists) {
      return {
        success: false,
        message: translateServer(locale, 'messages.partners.duplicateEmail', {
          email: result.data.email,
        }),
      }
    }
  }

  try {
    const partner = await businessPartnersRepository.create(result.data)
    return {
      success: true,
      data: partner,
    }
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to create business partner',
    }
  }
}
