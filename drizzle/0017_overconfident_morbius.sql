-- Custom migration: Add sucursal entity, sucursal_inventory, inventory_movement tables
-- and update POS tables to use sucursal_id instead of company_id

-- Create inventory_movement_type enum
DO $$ BEGIN
  CREATE TYPE "public"."inventory_movement_type" AS ENUM('in', 'out', 'transfer_to_sucursal', 'transfer_from_sucursal', 'adjustment');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create sucursal table
CREATE TABLE IF NOT EXISTS "sucursal" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "organization_id" uuid NOT NULL REFERENCES "organization"("id"),
  "company_id" uuid REFERENCES "company"("id"),
  "name" text NOT NULL,
  "code" text NOT NULL,
  "address" text,
  "phone" text,
  "is_active" boolean NOT NULL DEFAULT true,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "sucursal_code_org_idx" ON "sucursal" ("organization_id","code");
CREATE INDEX IF NOT EXISTS "sucursal_org_active_idx" ON "sucursal" ("organization_id","is_active");

-- Create sucursal_inventory table
CREATE TABLE IF NOT EXISTS "sucursal_inventory" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "sucursal_id" uuid NOT NULL REFERENCES "sucursal"("id") ON DELETE CASCADE,
  "product_id" uuid NOT NULL REFERENCES "product"("id") ON DELETE CASCADE,
  "stock" integer NOT NULL DEFAULT 0,
  "min_stock" integer NOT NULL DEFAULT 0,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "sucursal_inventory_sucursal_product_idx" ON "sucursal_inventory" ("sucursal_id","product_id");
CREATE INDEX IF NOT EXISTS "sucursal_inventory_sucursal_idx" ON "sucursal_inventory" ("sucursal_id");

-- Create inventory_movement table
CREATE TABLE IF NOT EXISTS "inventory_movement" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "organization_id" uuid NOT NULL REFERENCES "organization"("id"),
  "sucursal_id" uuid REFERENCES "sucursal"("id"),
  "product_id" uuid NOT NULL REFERENCES "product"("id"),
  "type" "inventory_movement_type" NOT NULL,
  "quantity" integer NOT NULL,
  "notes" text,
  "created_by" uuid,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "inventory_movement_org_idx" ON "inventory_movement" ("organization_id","created_at");
CREATE INDEX IF NOT EXISTS "inventory_movement_product_idx" ON "inventory_movement" ("product_id");
CREATE INDEX IF NOT EXISTS "inventory_movement_sucursal_idx" ON "inventory_movement" ("sucursal_id");

-- Add sucursal_id to POS tables (nullable to allow gradual migration from company_id)
ALTER TABLE "pos_terminal" ADD COLUMN IF NOT EXISTS "sucursal_id" uuid REFERENCES "sucursal"("id");
ALTER TABLE "pos_sale" ADD COLUMN IF NOT EXISTS "sucursal_id" uuid REFERENCES "sucursal"("id");
ALTER TABLE "pos_cashier" ADD COLUMN IF NOT EXISTS "sucursal_id" uuid REFERENCES "sucursal"("id");
ALTER TABLE "pos_session" ADD COLUMN IF NOT EXISTS "sucursal_id" uuid REFERENCES "sucursal"("id");

-- Drop old unique index on cashier (company_id + pin) and create new one (sucursal_id + pin)
DROP INDEX IF EXISTS "cashier_pin_company_idx";
CREATE UNIQUE INDEX IF NOT EXISTS "cashier_pin_sucursal_idx" ON "pos_cashier" ("sucursal_id","pin");
