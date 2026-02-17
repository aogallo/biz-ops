import { getLocaleFromRequest, translateServer } from '~/i18n/translate.server'
import { requireAuth } from '~/server/auth/session.server'
import { categoriesRepository } from '../repository'

export async function deleteCategory(request: Request, categoryId: string) {
  const session = await requireAuth(request)
  const locale = getLocaleFromRequest(request)
  const organizationId = session.session.activeOrganizationId

  if (!organizationId) {
    return { success: false, message: 'No active organization selected' }
  }

  const existing = await categoriesRepository.getById(categoryId)
  if (!existing) {
    return {
      success: false,
      message: translateServer(locale, 'messages.categories.notFound'),
    }
  }
  if (existing.organizationId !== organizationId) {
    return {
      success: false,
      message: translateServer(locale, 'messages.common.noPermission'),
    }
  }

  try {
    const result = await categoriesRepository.delete(categoryId)
    if (!result.success) {
      return {
        success: false,
        message: translateServer(locale, 'messages.categories.hasProducts'),
      }
    }
    return {
      success: true,
      message: translateServer(locale, 'messages.categories.deleted'),
    }
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error ? error.message : 'Failed to delete category',
    }
  }
}
