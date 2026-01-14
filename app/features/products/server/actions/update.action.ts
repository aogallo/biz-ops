import { requireAuth } from "~/server/auth/session.server";
import { createProductSchema } from "../../schemas";
import { productsRepository } from "../repository";

export async function updateProduct(request: Request, productId: string) {
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
      message: "You don't have permission to update this product",
    };
  }

  // Parse form data
  const formData = await request.formData();
  const inputValues = {
    name: formData.get("name"),
    sku: formData.get("sku"),
    price: formData.get("price"),
    stock: formData.get("stock") ? Number(formData.get("stock")) : 0,
    organizationId,
  };

  // Validate input
  const result = createProductSchema.safeParse(inputValues);
  if (!result.success) {
    return {
      success: false,
      message: "Validation failed",
      errors: result.error.flatten().fieldErrors,
    };
  }

  // Check SKU uniqueness within organization (excluding current product)
  const skuExists = await productsRepository.existsBySku(
    organizationId,
    result.data.sku,
    productId
  );

  if (skuExists) {
    return {
      success: false,
      message: `Product with SKU "${result.data.sku}" already exists in your organization`,
    };
  }

  // Update product
  try {
    const product = await productsRepository.update(productId, result.data);
    if (!product) {
      return {
        success: false,
        message: "Failed to update product",
      };
    }
    return {
      success: true,
      data: product,
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to update product",
    };
  }
}
