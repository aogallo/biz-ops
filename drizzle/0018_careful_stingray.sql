DO $$ BEGIN
  CREATE TYPE "public"."inventory_movement_type" AS ENUM('in', 'out', 'transfer_to_sucursal', 'transfer_from_sucursal', 'adjustment');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "inventory_movement" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"sucursal_id" uuid,
	"product_id" uuid NOT NULL,
	"type" "inventory_movement_type" NOT NULL,
	"quantity" integer NOT NULL,
	"notes" text,
	"created_by" uuid,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "sucursal_inventory" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sucursal_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"stock" integer DEFAULT 0 NOT NULL,
	"min_stock" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "sucursal" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"company_id" uuid,
	"name" text NOT NULL,
	"code" text NOT NULL,
	"address" text,
	"phone" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pos_cashier' AND column_name = 'company_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pos_cashier' AND column_name = 'sucursal_id'
  ) THEN
    ALTER TABLE "pos_cashier" RENAME COLUMN "company_id" TO "sucursal_id";
  END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pos_sale' AND column_name = 'company_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pos_sale' AND column_name = 'sucursal_id'
  ) THEN
    ALTER TABLE "pos_sale" RENAME COLUMN "company_id" TO "sucursal_id";
  END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pos_session' AND column_name = 'company_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pos_session' AND column_name = 'sucursal_id'
  ) THEN
    ALTER TABLE "pos_session" RENAME COLUMN "company_id" TO "sucursal_id";
  END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pos_terminal' AND column_name = 'company_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pos_terminal' AND column_name = 'sucursal_id'
  ) THEN
    ALTER TABLE "pos_terminal" RENAME COLUMN "company_id" TO "sucursal_id";
  END IF;
END $$;
--> statement-breakpoint
ALTER TABLE "pos_cashier" DROP CONSTRAINT IF EXISTS "pos_cashier_company_id_company_id_fk";
--> statement-breakpoint
ALTER TABLE "pos_sale" DROP CONSTRAINT IF EXISTS "pos_sale_company_id_company_id_fk";
--> statement-breakpoint
ALTER TABLE "pos_session" DROP CONSTRAINT IF EXISTS "pos_session_company_id_company_id_fk";
--> statement-breakpoint
ALTER TABLE "pos_terminal" DROP CONSTRAINT IF EXISTS "pos_terminal_company_id_company_id_fk";
--> statement-breakpoint
DROP INDEX IF EXISTS "cashier_pin_company_idx";--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "inventory_movement" ADD CONSTRAINT "inventory_movement_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "inventory_movement" ADD CONSTRAINT "inventory_movement_sucursal_id_sucursal_id_fk" FOREIGN KEY ("sucursal_id") REFERENCES "public"."sucursal"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "inventory_movement" ADD CONSTRAINT "inventory_movement_product_id_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "sucursal_inventory" ADD CONSTRAINT "sucursal_inventory_sucursal_id_sucursal_id_fk" FOREIGN KEY ("sucursal_id") REFERENCES "public"."sucursal"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "sucursal_inventory" ADD CONSTRAINT "sucursal_inventory_product_id_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "sucursal" ADD CONSTRAINT "sucursal_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "sucursal" ADD CONSTRAINT "sucursal_company_id_company_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."company"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "inventory_movement_org_idx" ON "inventory_movement" USING btree ("organization_id","created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "inventory_movement_product_idx" ON "inventory_movement" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "inventory_movement_sucursal_idx" ON "inventory_movement" USING btree ("sucursal_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "sucursal_inventory_sucursal_product_idx" ON "sucursal_inventory" USING btree ("sucursal_id","product_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "sucursal_inventory_sucursal_idx" ON "sucursal_inventory" USING btree ("sucursal_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "sucursal_code_org_idx" ON "sucursal" USING btree ("organization_id","code");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "sucursal_org_active_idx" ON "sucursal" USING btree ("organization_id","is_active");--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "pos_cashier" ADD CONSTRAINT "pos_cashier_sucursal_id_sucursal_id_fk" FOREIGN KEY ("sucursal_id") REFERENCES "public"."sucursal"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "pos_sale" ADD CONSTRAINT "pos_sale_sucursal_id_sucursal_id_fk" FOREIGN KEY ("sucursal_id") REFERENCES "public"."sucursal"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "pos_session" ADD CONSTRAINT "pos_session_sucursal_id_sucursal_id_fk" FOREIGN KEY ("sucursal_id") REFERENCES "public"."sucursal"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "pos_terminal" ADD CONSTRAINT "pos_terminal_sucursal_id_sucursal_id_fk" FOREIGN KEY ("sucursal_id") REFERENCES "public"."sucursal"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "cashier_pin_sucursal_idx" ON "pos_cashier" USING btree ("sucursal_id","pin");
