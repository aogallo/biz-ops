/** * --- Column Helpers---
 *
 */

import { timestamp } from "drizzle-orm/pg-core";

export const timestamps = {
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
};
