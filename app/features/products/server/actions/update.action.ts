import { getLocaleFromRequest, translateServer } from '~/i18n/translate.server'
import { requireAuth } from '~/server/auth/session.server'
import { createProductSchema } from '../../schemas'
import { productsRepository } from '../repository'

export async function updateProduct(request: Request, productId: string) {
  const session = await requireAuth(request)
  const locale = getLocaleFromRequest(request)
  const organizationId = session.session.activeOrganizationId

  if (!organizationId) {
    return {
      success: false,
      message: translateServer(locale, 'messages.products.noOrganization'),
    }
  }

  const existingProduct = await productsRepository.getById(productId)
  if (!existingProduct) {
    return {
      success: false,
      message: translateServer(locale, 'messages.products.notFound'),
    }
  }

  if (existingProduct.organizationId !== organizationId) {
    return {
      success: false,
      message: translateServer(locale, 'messages.common.noPermission'),
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

  const skuExists = await productsRepository.existsBySku(
    organizationId,
    result.data.sku,
    productId
  )
  if (skuExists) {
    return {
      success: false,
      message: translateServer(locale, 'messages.products.duplicateSku'),
    }
  }

  try {
    const product = await productsRepository.update(productId, result.data)
    if (!product) {
      return {
        success: false,
        message: translateServer(locale, 'messages.products.notFound'),
      }
    }
    return { success: true, data: product }
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to update product',
    }
  }
}
