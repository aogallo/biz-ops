import { redirect } from "react-router";
import auth from "~/server/auth-server";
import type { Route } from "./+types/logout";

export async function action({ request }: Route.ActionArgs) {
  // Use server-side Better Auth API to invalidate the session
  await auth.api.signOut({
    headers: request.headers,
  });

  // Clear the session cookie and redirect to login
  return redirect("/", {
    headers: {
      "Set-Cookie": "better-auth.session_token=; Max-Age=0; Path=/",
    },
  });
}

export function loader() {
  return redirect("/");
}
