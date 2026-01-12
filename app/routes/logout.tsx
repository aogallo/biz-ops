import { redirect } from "react-router";
import type { Route } from "./+types/logout";
import { logout } from "~/server/auth/session.server";

export async function action({ request }: Route.ActionArgs) {
  return await logout(request);
}

export function loader() {
  // Prevent GET requests
  return redirect("/");
}
