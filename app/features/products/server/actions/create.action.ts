import { requireAuth } from "~/server/auth/session.server";
import { createProductSchema } from "../../schemas";
import { productsRepository } from "../repository";

export async function createProduct(request: Request) {
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

  // Check SKU uniqueness within organization
  const existingProduct = await productsRepository.getBySku(
    organizationId,
    result.data.sku,
  );

  if (existingProduct) {
    return {
      success: false,
      message: `Product with SKU "${result.data.sku}" already exists in your organization`,
    };
  }

  // Create product
  try {
    const product = await productsRepository.create(result.data);
    return {
      success: true,
      data: product,
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to create product",
    };
  }
}
