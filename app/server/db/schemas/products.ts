import {
  integer,
  numeric,
  pgTable,
  text,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { organizationModel } from "./auth";
import { timestamps } from "./common";

// Products & Inventory
export const productModel = pgTable(
  "product",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizationModel.id),
    sku: text("sku").notNull(),
    name: text("name").notNull(),
    price: numeric("price", { precision: 12, scale: 2 }).notNull(),
    stock: integer("stock").default(0),
    ...timestamps,
  },
  (table) => ({
    // Composite unique constraint: SKU must be unique per organization
    skuOrgUnique: uniqueIndex("product_sku_org_idx").on(
      table.organizationId,
      table.sku
    ),
  })
);
