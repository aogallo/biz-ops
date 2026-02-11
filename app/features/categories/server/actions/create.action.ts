import { requireAuth } from '~/server/auth/session.server'
import { createCategorySchema } from '../../schemas'
import { categoriesRepository } from '../repository'

export async function createCategory(request: Request) {
  const session = await requireAuth(request)
  const organizationId = session.session.activeOrganizationId

  if (!organizationId) {
    return { success: false, message: 'No active organization selected' }
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

  // Check name uniqueness within organization
  const exists = await categoriesRepository.existsByName(
    organizationId,
    result.data.name
  )
  if (exists) {
    return {
      success: false,
      message: `Category "${result.data.name}" already exists in your organization`,
    }
  }

  try {
    const category = await categoriesRepository.create(result.data)
    return { success: true, data: category }
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error ? error.message : 'Failed to create category',
    }
  }
}
