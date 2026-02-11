import { requireAuth } from '~/server/auth/session.server'
import { createProductSchema } from '../../schemas'
import { productsRepository } from '../repository'

export async function createProduct(request: Request) {
  const session = await requireAuth(request)
  const organizationId = session.session.activeOrganizationId

  if (!organizationId) {
    return { success: false, message: 'No active organization selected' }
  }

  const formData = await request.formData()
  const inputValues = {
    name: formData.get('name'),
    sku: formData.get('sku'),
    price: formData.get('price'),
    stock: formData.get('stock') ? Number(formData.get('stock')) : 0,
    minStock: formData.get('minStock') ? Number(formData.get('minStock')) : 0,
    description: formData.get('description') || null,
    imageUrl: formData.get('imageUrl') || null,
    categoryId: formData.get('categoryId') || null,
    organizationId,
  }

  const result = createProductSchema.safeParse(inputValues)
  if (!result.success) {
    return {
      success: false,
      message: 'Validation failed',
      errors: result.error.flatten().fieldErrors,
    }
  }

  // Check SKU uniqueness within organization
  const existingProduct = await productsRepository.getBySku(
    organizationId,
    result.data.sku
  )
  if (existingProduct) {
    return {
      success: false,
      message: `Product with SKU "${result.data.sku}" already exists in your organization`,
    }
  }

  try {
    const product = await productsRepository.create(result.data)
    return { success: true, data: product }
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error ? error.message : 'Failed to create product',
    }
  }
}
