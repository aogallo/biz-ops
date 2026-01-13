import { Form, redirect, useActionData, useNavigation } from "react-router";
import { Button } from "~/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import type { Route } from "./+types/create";
import { createBusinessPartner } from "../server/actions/create.action";
import { useState } from "react";

export async function loader({ request }: Route.LoaderArgs) {
  const { requireAuth } = await import("~/server/auth/session.server");
  await requireAuth(request);
  return {};
}

export async function action({ request }: Route.ActionArgs) {
  const response = await createBusinessPartner(request);

  if (response.success && response.data) {
    return redirect(`/business-partners/${response.data.id}`);
  }

  return response;
}

export default function CreateBusinessPartner() {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  const [partnerType, setPartnerType] = useState<string>("");

  return (
    <div className="mx-auto max-w-2xl p-6">
      <h1 className="text-2xl font-bold mb-6">Add Business Partner</h1>

      <Form method="post" className="space-y-6">
        {actionData?.message && !actionData.success && (
          <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">
            {actionData.message}
          </div>
        )}

        <div>
          <label htmlFor="name" className="mb-2 block text-sm font-medium">
            Partner Name *
          </label>
          <input
            type="text"
            id="name"
            name="name"
            required
            placeholder="Acme Corporation"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          />
          {actionData?.errors?.name && (
            <p className="mt-1 text-xs text-destructive">
              {actionData.errors.name}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="type" className="mb-2 block text-sm font-medium">
            Partner Type *
          </label>
          <input type="hidden" name="type" value={partnerType} />
          <Select value={partnerType} onValueChange={setPartnerType} required>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select partner type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="client">Client (Customer)</SelectItem>
              <SelectItem value="vendor">Vendor (Supplier)</SelectItem>
              <SelectItem value="both">Both Client & Vendor</SelectItem>
            </SelectContent>
          </Select>
          {actionData?.errors?.type && (
            <p className="mt-1 text-xs text-destructive">
              {actionData.errors.type}
            </p>
          )}
          <p className="mt-1 text-xs text-muted-foreground">
            Choose how you do business with this partner
          </p>
        </div>

        <div>
          <label htmlFor="email" className="mb-2 block text-sm font-medium">
            Email Address
          </label>
          <input
            type="email"
            id="email"
            name="email"
            placeholder="contact@example.com"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          />
          {actionData?.errors?.email && (
            <p className="mt-1 text-xs text-destructive">
              {actionData.errors.email}
            </p>
          )}
          <p className="mt-1 text-xs text-muted-foreground">
            Optional - Primary contact email for this partner
          </p>
        </div>

        <div className="flex gap-3">
          <Button type="submit" disabled={isSubmitting || !partnerType}>
            {isSubmitting ? "Creating..." : "Create Partner"}
          </Button>
          <Button type="button" variant="outline" asChild>
            <a href="/business-partners">Cancel</a>
          </Button>
        </div>
      </Form>
    </div>
  );
}
