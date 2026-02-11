import { requireAuth } from '~/server/auth/session.server'
import { createProductSchema } from '../../schemas'
import { productsRepository } from '../repository'

export async function updateProduct(request: Request, productId: string) {
  const session = await requireAuth(request)
  const organizationId = session.session.activeOrganizationId

  if (!organizationId) {
    return { success: false, message: 'No active organization selected' }
  }

  const existingProduct = await productsRepository.getById(productId)
  if (!existingProduct) {
    return { success: false, message: 'Product not found' }
  }
  if (existingProduct.organizationId !== organizationId) {
    return {
      success: false,
      message: "You don't have permission to update this product",
    }
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

  // Check SKU uniqueness (excluding current product)
  const skuExists = await productsRepository.existsBySku(
    organizationId,
    result.data.sku,
    productId
  )
  if (skuExists) {
    return {
      success: false,
      message: `Product with SKU "${result.data.sku}" already exists in your organization`,
    }
  }

  try {
    const product = await productsRepository.update(productId, result.data)
    if (!product) {
      return { success: false, message: 'Failed to update product' }
    }
    return { success: true, data: product }
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error ? error.message : 'Failed to update product',
    }
  }
}
