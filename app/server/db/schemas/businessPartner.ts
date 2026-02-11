import { pgTable, text, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { organizationModel } from "./auth";
import { timestamps } from "./common";

// Business Partners (Vendors & Clients)
export const businessPartnerModel = pgTable(
  "business_partner",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizationModel.id),
    name: text("name").notNull(),
    type: text("type").notNull(), // 'client', 'vendor', 'both'
    email: text("email"),
    nit: text("nit"),
    phone: text("phone"),
    notes: text("notes"),
    ...timestamps,
  },
  (table) => [
    // Email must be unique per organization (if provided)
    uniqueIndex("business_partner_email_org_idx").on(
      table.organizationId,
      table.email,
    ),
    // NIT must be unique per organization (if provided)
    uniqueIndex("business_partner_nit_org_idx").on(
      table.organizationId,
      table.nit,
    ),
  ],
);
