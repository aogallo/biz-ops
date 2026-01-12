import { pgTable, text, uuid } from "drizzle-orm/pg-core";
import { organizationModel } from "./auth";
import { timestamps } from "./common";

// Companies (Legal entities under one Organization)
export const companyModel = pgTable("company", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizationModel.id),
  name: text("name").notNull(),
  taxId: text("tax_id"),
  ...timestamps,
});
