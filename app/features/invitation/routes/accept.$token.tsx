import { eq } from "drizzle-orm";
import { Form, redirect } from "react-router";
import auth from "~/server/auth-server";
import { db } from "~/server/db";
import {
  invitation,
  member,
  user as userTable,
} from "~/server/db/schema";
import type { Route } from "./+types/accept.$token";

export async function loader({ params }: Route.LoaderArgs) {
  const token = params.token;

  // Get invitation
  const [inv] = await db
    .select()
    .from(invitation)
    .where(eq(invitation.id, token))
    .limit(1);

  if (!inv) {
    return { error: "Invitation not found", invitation: null };
  }

  if (inv.status !== "pending") {
    return {
      error: "This invitation has already been used",
      invitation: null,
    };
  }

  if (new Date() > inv.expiresAt) {
    return { error: "This invitation has expired", invitation: null };
  }

  return { invitation: inv, error: null };
}

export async function action({ params, request }: Route.ActionArgs) {
  const token = params.token;
  const formData = await request.formData();

  const name = formData.get("name") as string;
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  // Validation
  if (!name || !password || !confirmPassword) {
    return { error: "All fields are required" };
  }

  if (password !== confirmPassword) {
    return { error: "Passwords do not match" };
  }

  if (password.length < 8) {
    return { error: "Password must be at least 8 characters" };
  }

  try {
    // Get invitation
    const [inv] = await db
      .select()
      .from(invitation)
      .where(eq(invitation.id, token))
      .limit(1);

    if (!inv || inv.status !== "pending") {
      return { error: "Invalid or expired invitation" };
    }

    if (new Date() > inv.expiresAt) {
      return { error: "This invitation has expired" };
    }

    // Check if user already exists
    const [existingUser] = await db
      .select()
      .from(userTable)
      .where(eq(userTable.email, inv.email))
      .limit(1);

    if (existingUser) {
      // User exists - they need to log in first, then accept invitation
      return {
        error:
          "An account with this email already exists. Please log in to accept the invitation.",
      };
    }

    // Sign up new user with Better Auth
    // Create a signup request to Better Auth's handler
    const signUpRequest = new Request(
      `${request.url.split("/")[0]}//${request.headers.get("host")}/api/auth/sign-up/email`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...Object.fromEntries(request.headers.entries()),
        },
        body: JSON.stringify({
          name,
          email: inv.email,
          password,
        }),
      },
    );

    const signUpResponse = await auth.handler(signUpRequest);

    // Check if signup was successful
    if (!signUpResponse.ok) {
      const errorText = await signUpResponse.text();
      let errorMessage = "Failed to create account";
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.message || errorMessage;
      } catch {
        // If parsing fails, use default message
      }
      return { error: errorMessage };
    }

    const userData = (await signUpResponse.json()) as {
      user: { id: string; email: string; name: string };
      session: { id: string; userId: string };
    };
    const userId = userData.user.id;

    // Create member with assigned role
    await db.insert(member).values({
      id: crypto.randomUUID(),
      organizationId: inv.organizationId,
      userId,
      roleId: inv.roleId,
      role: inv.role, // Use role from invitation
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Mark invitation as accepted
    await db
      .update(invitation)
      .set({ status: "accepted", updatedAt: new Date() })
      .where(eq(invitation.id, token));

    // Redirect to organization (user is now logged in via session)
    return redirect("/organization");
  } catch (error) {
    console.error("Error accepting invitation:", error);
    return { error: "Failed to accept invitation. Please try again." };
  }
}

export default function AcceptInvitation({
  loaderData,
  actionData,
}: Route.ComponentProps) {
  const { invitation, error: loaderError } = loaderData;
  const actionError = actionData?.error;

  if (loaderError || !invitation) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-md">
          <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
            <h1 className="mb-2 text-xl font-bold text-red-900">
              Invalid Invitation
            </h1>
            <p className="text-sm text-red-700">
              {loaderError || "This invitation is no longer valid."}
            </p>
            <a
              href="/login"
              className="mt-4 inline-block text-sm text-red-900 underline hover:no-underline"
            >
              Go to Login
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="rounded-lg border bg-white p-8 shadow-sm">
          <h1 className="mb-2 text-2xl font-bold">Accept Invitation</h1>
          <p className="mb-6 text-sm text-muted-foreground">
            You've been invited to join an organization. Create your account to
            get started.
          </p>

          <div className="mb-6 rounded-lg bg-blue-50 p-4">
            <p className="text-sm">
              <span className="font-medium">Email:</span> {invitation.email}
            </p>
          </div>

          {actionError && (
            <div className="mb-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {actionError}
            </div>
          )}

          <Form method="post" className="space-y-4">
            <div>
              <label htmlFor="name" className="mb-2 block text-sm font-medium">
                Full Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                required
                placeholder="John Doe"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-medium"
              >
                Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                required
                minLength={8}
                placeholder="At least 8 characters"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="mb-2 block text-sm font-medium"
              >
                Confirm Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                required
                minLength={8}
                placeholder="Re-enter your password"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Create Account & Join
            </button>
          </Form>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            Already have an account?{" "}
            <a href="/login" className="text-primary hover:underline">
              Log in
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
