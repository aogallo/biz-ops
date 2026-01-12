import { Form, useActionData, useNavigation } from "react-router";
import { requireAuth } from "~/server/auth/session.server";
import type { Route } from "../../admin/routes/+types/organizations.create";
import { createOrganization } from "../server/actions/create.action";

export async function loader({ request }: Route.LoaderArgs) {
  await requireAuth(request);
  return {};
}

export async function action({ request }: Route.ActionArgs) {
  const data = await request.formData();
  const response = await createOrganization(data);
  return response;
}

export default function CreateOrganization() {
  const actionData = useActionData<typeof createOrganization>();
  const navigation = useNavigation();

  return (
    <div className="self-stretch p-6">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-2xl font-bold">Create New Organization</h1>

        <Form method="post" className="space-y-6">
          {actionData?.message && (
            <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">
              {actionData.message}
            </div>
          )}

          <div>
            <label htmlFor="name" className="mb-2 block text-sm font-medium">
              Organization Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              required
              placeholder="Acme Corporation"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              The full name of your organization
            </p>
          </div>

          <div>
            <label htmlFor="slug" className="mb-2 block text-sm font-medium">
              URL Slug
            </label>
            <input
              type="text"
              id="slug"
              name="slug"
              required
              placeholder="acme-corp"
              pattern="[a-z0-9-]+"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Lowercase letters, numbers, and hyphens only (e.g., acme-corp)
            </p>
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              {navigation.state === "submitting" ? "Creating...." : "Create"}
            </button>
            <a
              href="/organization"
              className="rounded-md border border-input px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
            >
              Cancel
            </a>
          </div>
        </Form>
      </div>
    </div>
  );
}
