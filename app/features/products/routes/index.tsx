import { Link } from "react-router";
import { Button } from "~/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { useCanPerformAction } from "~/hooks/usePermissions";
import { requireAuth } from "~/server/auth/session.server";
import { getFlash } from "~/server/flash.server";
import type { Route } from "./+types/index";
import { productsRepository } from "../server/repository";
import { useToastFromLoader, type ToastData } from "~/hooks/useToastFromLoader";

export async function loader({ request }: Route.LoaderArgs) {
  const session = await requireAuth(request);

  // Get flash message and headers to clear it
  const { flash, headers } = getFlash(request);

  const organizationId = session.session.activeOrganizationId;
  if (!organizationId) {
    return Response.json(
      {
        products: [],
        noOrganization: true,
        toast: flash,
      },
      { headers },
    );
  }

  const products =
    await productsRepository.getAllByOrganization(organizationId);

  return Response.json(
    {
      products,
      noOrganization: false,
      toast: flash,
    },
    { headers },
  );
}

export default function ProductsIndex({ loaderData }: Route.ComponentProps) {
  const { products, noOrganization, toast } = loaderData;
  const canCreateProduct = useCanPerformAction("products.create");

  // Show toast if present in loader data
  useToastFromLoader(toast);

  if (noOrganization) {
    return (
      <div className="p-6">
        <div className="rounded-lg border border-dashed p-8 text-center">
          <p className="mb-4 text-muted-foreground">
            Please select an organization to view products.
          </p>
          <Link to="/organization">
            <Button>Select Organization</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Products</h1>
          <p className="text-muted-foreground">
            Manage your product catalog and inventory
          </p>
        </div>
        {canCreateProduct && (
          <Link to="/products/new">
            <Button>Add Product</Button>
          </Link>
        )}
      </div>

      {products.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <p className="mb-4 text-muted-foreground">
            No products found. Create your first product to get started.
          </p>
          {canCreateProduct && (
            <Link to="/products/new">
              <Button>Create Product</Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>SKU</TableHead>
                <TableHead>Name</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right">Stock</TableHead>
                <TableHead>Created</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-mono text-sm">
                    {product.sku}
                  </TableCell>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell className="text-right">
                    ${Number(product.price).toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right">
                    <span
                      className={
                        (product.stock ?? 0) === 0
                          ? "text-destructive"
                          : (product.stock ?? 0) < 10
                            ? "text-amber-600"
                            : "text-green-600"
                      }
                    >
                      {product.stock ?? 0}
                    </span>
                  </TableCell>
                  <TableCell>
                    {new Date(product.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Link
                      to={`/products/${product.sku}`}
                      className="text-sm font-medium text-primary hover:underline"
                    >
                      View →
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
