import { GalleryVerticalEnd } from "lucide-react";
import { redirect } from "react-router";
import type { Route } from "./+types/login";

import { LoginForm } from "~/components/login-form";
import { getOptionalAuth } from "~/server/auth/session.server";

export async function loader({ request }: Route.LoaderArgs) {
  const session = await getOptionalAuth(request);

  // Redirect if already logged in
  if (session) {
    return redirect("/organization");
  }

  // Extract messages from query params
  const url = new URL(request.url);
  const message = url.searchParams.get("message");
  const error = url.searchParams.get("error");

  return { message, error };
}

export default function LoginPage({ loaderData }: Route.ComponentProps) {
  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <a href="#" className="flex items-center gap-2 self-center font-medium">
          <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
            <GalleryVerticalEnd className="size-4" />
          </div>
          Acme Inc.
        </a>
        <LoginForm message={loaderData?.message} error={loaderData?.error} />
      </div>
    </div>
  );
}
