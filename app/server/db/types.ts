import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import type { NeonHttpDatabase } from "drizzle-orm/neon-http";
import type { schema } from "./schemas";

// Union type for both database connection types
export type DrizzleClient =
  | NodePgDatabase<typeof schema>
  | NeonHttpDatabase<typeof schema>;
