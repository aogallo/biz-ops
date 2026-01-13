import { requireAuth } from "~/server/auth/session.server";
import { productsRepository } from "../repository";

export async function deleteProduct(request: Request, productId: string) {
  // Authenticate user
  const session = await requireAuth(request);

  // Get active organization from session
  const organizationId = session.session.activeOrganizationId;
  if (!organizationId) {
    return {
      success: false,
      message: "No active organization selected",
    };
  }

  // Verify product exists and belongs to organization
  const existingProduct = await productsRepository.getById(productId);
  if (!existingProduct) {
    return {
      success: false,
      message: "Product not found",
    };
  }

  if (existingProduct.organizationId !== organizationId) {
    return {
      success: false,
      message: "You don't have permission to delete this product",
    };
  }

  // Delete product
  try {
    const deleted = await productsRepository.delete(productId);
    if (!deleted) {
      return {
        success: false,
        message: "Failed to delete product",
      };
    }
    return {
      success: true,
      message: "Product deleted successfully",
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to delete product",
    };
  }
}
