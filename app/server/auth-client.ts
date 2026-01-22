import { createAuthClient } from 'better-auth/client'

export const authClient = createAuthClient({
  /** The base URL of the server (optional if you're using the same domain) */
  baseURL:
    typeof window !== 'undefined'
      ? window.location.origin
      : process.env.BETTER_AUTH_URL!,
})
