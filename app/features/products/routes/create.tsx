import { Form, redirect, useActionData, useNavigation } from "react-router";
import { Button } from "~/components/ui/button";
import type { Route } from "./+types/create";
import { createProduct } from "../server/actions/create.action";

export async function loader({ request }: Route.LoaderArgs) {
  // Action handles auth, but loader ensures page is protected
  const { requireAuth } = await import("~/server/auth/session.server");
  await requireAuth(request);
  return {};
}

export async function action({ request }: Route.ActionArgs) {
  const response = await createProduct(request);

  // Redirect on success
  if (response.success && response.data) {
    return redirect(`/products/${response.data.sku}`);
  }

  return response;
}

export default function CreateProduct() {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  return (
    <div className="mx-auto max-w-2xl p-6">
      <h1 className="text-2xl font-bold mb-6">Create New Product</h1>

      <Form method="post" className="space-y-6">
        {actionData?.message && !actionData.success && (
          <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">
            {actionData.message}
          </div>
        )}

        <div>
          <label htmlFor="sku" className="mb-2 block text-sm font-medium">
            SKU (Stock Keeping Unit) *
          </label>
          <input
            type="text"
            id="sku"
            name="sku"
            required
            placeholder="PROD-001"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          />
          {actionData?.errors?.sku && (
            <p className="mt-1 text-xs text-destructive">
              {actionData.errors.sku}
            </p>
          )}
          <p className="mt-1 text-xs text-muted-foreground">
            Unique identifier for this product in your organization
          </p>
        </div>

        <div>
          <label htmlFor="name" className="mb-2 block text-sm font-medium">
            Product Name *
          </label>
          <input
            type="text"
            id="name"
            name="name"
            required
            placeholder="Premium Widget"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          />
          {actionData?.errors?.name && (
            <p className="mt-1 text-xs text-destructive">
              {actionData.errors.name}
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="price" className="mb-2 block text-sm font-medium">
              Price *
            </label>
            <input
              type="number"
              id="price"
              name="price"
              required
              step="0.01"
              min="0"
              placeholder="99.99"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
            {actionData?.errors?.price && (
              <p className="mt-1 text-xs text-destructive">
                {actionData.errors.price}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="stock" className="mb-2 block text-sm font-medium">
              Initial Stock
            </label>
            <input
              type="number"
              id="stock"
              name="stock"
              min="0"
              defaultValue="0"
              placeholder="0"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
            {actionData?.errors?.stock && (
              <p className="mt-1 text-xs text-destructive">
                {actionData.errors.stock}
              </p>
            )}
          </div>
        </div>

        <div className="flex gap-3">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : "Create Product"}
          </Button>
          <Button type="button" variant="outline" asChild>
            <a href="/products">Cancel</a>
          </Button>
        </div>
      </Form>
    </div>
  );
}
