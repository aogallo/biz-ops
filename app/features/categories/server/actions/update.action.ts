import { requireAuth } from '~/server/auth/session.server'
import { createCategorySchema } from '../../schemas'
import { categoriesRepository } from '../repository'

export async function updateCategory(request: Request, categoryId: string) {
  const session = await requireAuth(request)
  const organizationId = session.session.activeOrganizationId

  if (!organizationId) {
    return { success: false, message: 'No active organization selected' }
  }

  const existing = await categoriesRepository.getById(categoryId)
  if (!existing) {
    return { success: false, message: 'Category not found' }
  }
  if (existing.organizationId !== organizationId) {
    return {
      success: false,
      message: "You don't have permission to update this category",
    }
  }

  const formData = await request.formData()
  const inputValues = {
    name: formData.get('name'),
    color: formData.get('color') || 'blue',
    organizationId,
  }

  const result = createCategorySchema.safeParse(inputValues)
  if (!result.success) {
    return {
      success: false,
      message: 'Validation failed',
      errors: result.error.flatten().fieldErrors,
    }
  }

  // Check name uniqueness (excluding current)
  const exists = await categoriesRepository.existsByName(
    organizationId,
    result.data.name,
    categoryId
  )
  if (exists) {
    return {
      success: false,
      message: `Category "${result.data.name}" already exists in your organization`,
    }
  }

  try {
    const category = await categoriesRepository.update(categoryId, result.data)
    if (!category) {
      return { success: false, message: 'Failed to update category' }
    }
    return { success: true, data: category }
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error ? error.message : 'Failed to update category',
    }
  }
}
