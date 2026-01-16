import { neon } from '@neondatabase/serverless'
import { drizzle as drizzleNeon } from 'drizzle-orm/neon-http'
import { drizzle as drizzlePg } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'

type DbInstance = ReturnType<typeof drizzleNeon> | ReturnType<typeof drizzlePg>

let _db: DbInstance | null = null

function isCloudflareWorker(): boolean {
  // Cloudflare Workers have 'navigator.userAgent' but no 'process.versions'
  return (
    typeof navigator !== 'undefined' &&
    typeof navigator.userAgent === 'string' &&
    navigator.userAgent.includes('Cloudflare-Workers')
  )
}

function shouldUseLocalDb(): boolean {
  const useLocalDb = process.env.USE_LOCAL_DB === 'true'

  // In Cloudflare Workers, always use Neon HTTP
  if (isCloudflareWorker()) {
    return false
  }

  // For Node.js scripts (migrations, seeds), use local if flagged
  return useLocalDb
}

function getDb(): DbInstance {
  if (!_db) {
    console.log('Initializing database connection...')
    const databaseUrl = process.env.DATABASE_URL

    if (!databaseUrl) {
      throw new Error('DATABASE_URL environment variable is not set')
    }

    const useLocal = shouldUseLocalDb()

    if (useLocal) {
      console.log('✓ Using local PostgreSQL (node-postgres)')
      const pool = new Pool({ connectionString: databaseUrl })
      _db = drizzlePg(pool)
    } else {
      console.log('✓ Using Neon HTTP connection')
      const sql = neon(databaseUrl)
      _db = drizzleNeon({ client: sql })
    }
  }
  return _db
}

// Export proxy for lazy initialization
export const db = new Proxy({} as DbInstance, {
  get(_target, prop) {
    const dbInstance = getDb()
    // Cast via unknown first to avoid incompatible-type cast errors between
    // different database client return types and Record<PropertyKey, unknown>.
    const value = (dbInstance as unknown as Record<PropertyKey, unknown>)[prop]
    return typeof value === 'function'
      ? (value as (...args: unknown[]) => unknown).bind(dbInstance)
      : value
  },
})

// Export helper to get current connection type for Better Auth adapter
export function getConnectionType(): 'pg' | 'neon-http' {
  return shouldUseLocalDb() ? 'pg' : 'neon-http'
}
