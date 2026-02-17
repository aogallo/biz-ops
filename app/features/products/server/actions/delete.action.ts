import { getLocaleFromRequest, translateServer } from '~/i18n/translate.server'
import { requireAuth } from '~/server/auth/session.server'
import { productsRepository } from '../repository'

export async function deleteProduct(request: Request, productId: string) {
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

  try {
    const deleted = await productsRepository.delete(productId)
    if (!deleted) {
      return {
        success: false,
        message: translateServer(locale, 'messages.products.notFound'),
      }
    }
    return {
      success: true,
      message: translateServer(locale, 'messages.products.deleted'),
    }
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to delete product',
    }
  }
}
