import { Link } from "react-router";
import { Button } from "~/components/ui/button";
import {
  getUserOrganizations,
  requireOrganizationAdmin,
} from "~/server/auth/organization.server";
import { requireAuth } from "~/server/auth/session.server";
import type { Route } from "./+types/index";

export async function loader({ request }: Route.LoaderArgs) {
  try {
    console.log("Loading organizations for user...");
    const session = await requireAuth(request);
    await requireOrganizationAdmin(session);
    const organizations = await getUserOrganizations(session.user.id);

    return { organizations };
  } catch (error) {
    console.error("Error loading organizations:", error);
    return { organizations: [] };
  }
}

export default function Organization({ loaderData }: Route.ComponentProps) {
  const { organizations } = loaderData;

  return (
    <div className="">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Your Organizations</h1>
        <Link to="/organization/new">
          <Button>Create Organization</Button>
        </Link>
      </div>

      {organizations.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <p className="mb-4 text-muted-foreground">
            You are not a member of any organizations yet.
          </p>
          <Link
            to="/organization/new"
            className="inline-flex rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Create Your First Organization
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {organizations.map(({ organization, membership }) => (
            <div
              key={organization.id}
              className="rounded-lg border p-6 shadow-sm transition-shadow hover:shadow-md"
            >
              <h2 className="mb-2 text-lg font-semibold">
                {organization.name}
              </h2>
              <p className="mb-4 text-sm text-muted-foreground">
                @{organization.slug}
              </p>
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                  {membership.role}
                </span>
                <Link
                  to={`/organization/${organization.slug}`}
                  className="text-sm font-medium text-primary hover:underline"
                >
                  Open →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
