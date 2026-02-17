import auth from '~/server/auth-server'
import { requireAuth } from '~/server/auth/session.server'
import { organizationRepository } from '../repository'
import { getLocaleFromRequest, translateServer } from '~/i18n/translate.server'

export async function deleteOrganization(request: Request, slug: string) {
  // Authenticate user
  await requireAuth(request)
  const locale = getLocaleFromRequest(request)

  const existingOrganzation = await organizationRepository.getBySlug(slug)

  if (!existingOrganzation) {
    return {
      success: false,
      message: translateServer(locale, 'common.noOrganization'),
    }
  }

  try {
    const data = await auth.api.deleteOrganization({
      body: { organizationId: existingOrganzation.id },
      headers: request.headers,
    })

    console.log('Organization deleted:', data?.id)

    return {
      success: true,
      message: translateServer(locale, 'organization.deleted'),
    }
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : translateServer(locale, 'organization.deleted.failed'),
    }
  }
}
