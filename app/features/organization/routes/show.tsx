import { Link, useNavigation } from "react-router";
import { Button } from "~/components/ui/button";
import { OrganizationRepository } from "../server/repository";
import type { Route } from "./+types/show";

export async function loader({ params }: Route.LoaderArgs) {
  const repo = new OrganizationRepository();
  const { slug } = params;

  const organization = await repo.getBySlug(slug);

  return { organization };
}

export default function Show({ loaderData }: Route.ComponentProps) {
  const { organization } = loaderData;
  const navigation = useNavigation();
  const metadata = organization?.metadata ?? {};

  return (
    <div className="">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold ">Organization Settings</h1>
          <p className="text-muted-foreground">
            View and manage your profile information.
          </p>
        </div>
        <div>
          <Button>
            {navigation.state === "submitting" ? "Saving..." : "Save"}
          </Button>
          <Link to="/organization">
            <Button variant="ghost">Cancel</Button>
          </Link>
        </div>
      </div>

      {/* Logo and Basic Info */}
      <div className="flex items-center gap-6 rounded-lg border bg-card p-6 shadow-sm">
        {organization?.logo && (
          <img
            src={organization.logo}
            alt={organization.name || "Organization"}
            className="h-24 w-24 rounded-full border-2 border-primary"
          />
        )}
        <div>
          <h2 className="text-2xl font-bold">
            {organization?.name || "Unknown User"}
          </h2>
          <p className="text-muted-foreground">{organization?.slug}</p>
        </div>
      </div>

      {/* Raw User Data (for debugging) */}
      <details className="rounded-lg border bg-card p-6 shadow-sm">
        <summary className="cursor-pointer text-lg font-semibold">
          {" "}
          Raw User Data (Debug)
        </summary>
        <pre className="mt-4 overflow-auto rounded bg-muted p-4 text-xs">
          {JSON.stringify(metadata, null, 2)}
        </pre>
      </details>
    </div>
  );
}
