import { requireAuth } from '~/server/auth/session.server'
import { CATEGORY_MESSAGES } from '../../messages'
import { categoriesRepository } from '../repository'

export async function deleteCategory(request: Request, categoryId: string) {
  const session = await requireAuth(request)
  const organizationId = session.session.activeOrganizationId

  if (!organizationId) {
    return { success: false, message: 'No active organization selected' }
  }

  const existing = await categoriesRepository.getById(categoryId)
  if (!existing) {
    return { success: false, message: CATEGORY_MESSAGES.notFound }
  }
  if (existing.organizationId !== organizationId) {
    return {
      success: false,
      message: "You don't have permission to delete this category",
    }
  }

  try {
    const result = await categoriesRepository.delete(categoryId)
    if (!result.success) {
      return { success: false, message: CATEGORY_MESSAGES.hasProducts }
    }
    return { success: true, message: CATEGORY_MESSAGES.deleted }
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error ? error.message : 'Failed to delete category',
    }
  }
}
