import { numeric, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { organizationModel } from "./auth";
import { businessPartnerModel } from "./businessPartner";
import { timestamps } from "./common";
import { companyModel } from "./company";

// Invoices
export const invoiceModel = pgTable("invoice", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizationModel.id),
  companyId: uuid("company_id")
    .notNull()
    .references(() => companyModel.id),
  partnerId: uuid("partner_id")
    .notNull()
    .references(() => businessPartnerModel.id),
  number: text("number").notNull(),
  total: numeric("total", { precision: 12, scale: 2 }).notNull(),
  status: text("status").default("unpaid"),
  date: timestamp("date").defaultNow(),
  ...timestamps,
});
