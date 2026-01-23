import { getUserOrganizations } from './organization.server'

/**
 * Determines the appropriate redirect URL after successful login
 * based on user's organization memberships.
 *
 * - If user has no memberships -> /welcome
 * - If user has memberships -> /organization/{first-org-slug}
 */
export async function getPostLoginRedirect(userId: string): Promise<string> {
  const organizations = await getUserOrganizations(userId)

  if (organizations.length === 0) {
    return '/welcome'
  }

  // Redirect to the first organization's dashboard
  return `/organization/${organizations[0].organization.slug}`
}
