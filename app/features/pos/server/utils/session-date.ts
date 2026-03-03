/**
 * Returns true if the session was opened on a previous calendar day (UTC).
 * Note: Cloudflare Workers use UTC. Guatemala is UTC-6. Timezone-aware
 * enforcement can be added later when the codebase adopts timezone handling.
 */
export function isStaleSession(openedAt: Date): boolean {
  const now = new Date()
  return (
    openedAt.getFullYear() !== now.getFullYear() ||
    openedAt.getMonth() !== now.getMonth() ||
    openedAt.getDate() !== now.getDate()
  )
}
