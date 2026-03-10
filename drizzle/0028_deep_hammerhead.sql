CREATE TYPE "public"."kitchen_item_status" AS ENUM('pending', 'ready');--> statement-breakpoint
CREATE TYPE "public"."kitchen_ticket_status" AS ENUM('pending', 'in_progress', 'ready', 'served');--> statement-breakpoint
CREATE TYPE "public"."order_detail_line_type" AS ENUM('product', 'combo', 'combo_item');--> statement-breakpoint
CREATE TYPE "public"."pos_sale_line_type" AS ENUM('product', 'combo', 'combo_item');--> statement-breakpoint
CREATE TYPE "public"."uom_category" AS ENUM('weight', 'volume', 'count', 'other');--> statement-breakpoint
ALTER TYPE "public"."pos_payment_method" ADD VALUE 'cash_usd';--> statement-breakpoint
ALTER TYPE "public"."product_type" ADD VALUE 'ingredient';--> statement-breakpoint
ALTER TYPE "public"."product_type" ADD VALUE 'recipe';--> statement-breakpoint
ALTER TYPE "public"."product_type" ADD VALUE 'combo';--> statement-breakpoint
ALTER TYPE "public"."product_type" ADD VALUE 'sale_item';--> statement-breakpoint
CREATE TABLE "combo_group_item" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"group_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"price_adjustment" numeric(12, 2) DEFAULT '0' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "combo_group" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"combo_id" uuid NOT NULL,
	"name" text NOT NULL,
	"min_select" integer DEFAULT 1 NOT NULL,
	"max_select" integer DEFAULT 1 NOT NULL,
	"is_required" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "combo" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "combo_product_id_unique" UNIQUE("product_id")
);
--> statement-breakpoint
CREATE TABLE "exchange_rate" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"from_currency" text NOT NULL,
	"to_currency" text NOT NULL,
	"rate" numeric(10, 4) NOT NULL,
	"effective_date" date NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_by" uuid,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "unit_of_measure" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"name" text NOT NULL,
	"abbreviation" text NOT NULL,
	"category" "uom_category" DEFAULT 'count' NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recipe_item" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"recipe_id" uuid NOT NULL,
	"ingredient_product_id" uuid NOT NULL,
	"quantity" numeric(12, 4) NOT NULL,
	"unit_of_measure_id" uuid,
	"notes" text,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recipe" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"servings" integer DEFAULT 1 NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "recipe_product_id_unique" UNIQUE("product_id")
);
--> statement-breakpoint
CREATE TABLE "kitchen_station" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"sucursal_id" uuid,
	"name" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "kitchen_ticket_item" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ticket_id" uuid NOT NULL,
	"product_id" uuid,
	"product_name" text NOT NULL,
	"quantity" numeric(12, 4) NOT NULL,
	"station_id" uuid,
	"modifications_json" jsonb,
	"status" "kitchen_item_status" DEFAULT 'pending' NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "kitchen_ticket" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"sucursal_id" uuid,
	"sale_id" uuid,
	"status" "kitchen_ticket_status" DEFAULT 'pending' NOT NULL,
	"ticket_number" integer NOT NULL,
	"notes" text,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "inventory_movement" ALTER COLUMN "quantity" SET DATA TYPE numeric(12, 4);--> statement-breakpoint
ALTER TABLE "sucursal_inventory" ALTER COLUMN "stock" SET DATA TYPE numeric(12, 4);--> statement-breakpoint
ALTER TABLE "sucursal_inventory" ALTER COLUMN "stock" SET DEFAULT '0';--> statement-breakpoint
ALTER TABLE "product" ADD COLUMN "track_inventory" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "product" ADD COLUMN "unit_of_measure_id" uuid;--> statement-breakpoint
ALTER TABLE "order_detail" ADD COLUMN "line_type" "order_detail_line_type" DEFAULT 'product';--> statement-breakpoint
ALTER TABLE "order_detail" ADD COLUMN "parent_line_id" uuid;--> statement-breakpoint
ALTER TABLE "order_detail" ADD COLUMN "combo_template_id" uuid;--> statement-breakpoint
ALTER TABLE "pos_payment" ADD COLUMN "exchange_rate" numeric(10, 4);--> statement-breakpoint
ALTER TABLE "pos_sale_line" ADD COLUMN "line_type" "pos_sale_line_type" DEFAULT 'product' NOT NULL;--> statement-breakpoint
ALTER TABLE "pos_sale_line" ADD COLUMN "parent_line_id" uuid;--> statement-breakpoint
ALTER TABLE "pos_sale_line" ADD COLUMN "combo_template_id" uuid;--> statement-breakpoint
ALTER TABLE "pos_sale_line" ADD COLUMN "modifications_json" jsonb;--> statement-breakpoint
ALTER TABLE "pos_terminal" ADD COLUMN "kitchen_printer_name" text;--> statement-breakpoint
ALTER TABLE "pos_terminal" ADD COLUMN "kitchen_printer_host" text;--> statement-breakpoint
ALTER TABLE "pos_terminal" ADD COLUMN "kitchen_printer_port" integer;--> statement-breakpoint
ALTER TABLE "pos_terminal" ADD COLUMN "kitchen_print_method" text;--> statement-breakpoint
ALTER TABLE "inventory_movement" ADD COLUMN "reference_type" text;--> statement-breakpoint
ALTER TABLE "inventory_movement" ADD COLUMN "reference_id" uuid;--> statement-breakpoint
ALTER TABLE "inventory_movement" ADD COLUMN "unit_of_measure_id" uuid;--> statement-breakpoint
ALTER TABLE "combo_group_item" ADD CONSTRAINT "combo_group_item_group_id_combo_group_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."combo_group"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "combo_group_item" ADD CONSTRAINT "combo_group_item_product_id_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "combo_group" ADD CONSTRAINT "combo_group_combo_id_combo_id_fk" FOREIGN KEY ("combo_id") REFERENCES "public"."combo"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "combo" ADD CONSTRAINT "combo_product_id_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exchange_rate" ADD CONSTRAINT "exchange_rate_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exchange_rate" ADD CONSTRAINT "exchange_rate_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "unit_of_measure" ADD CONSTRAINT "unit_of_measure_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipe_item" ADD CONSTRAINT "recipe_item_recipe_id_recipe_id_fk" FOREIGN KEY ("recipe_id") REFERENCES "public"."recipe"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipe_item" ADD CONSTRAINT "recipe_item_ingredient_product_id_product_id_fk" FOREIGN KEY ("ingredient_product_id") REFERENCES "public"."product"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipe_item" ADD CONSTRAINT "recipe_item_unit_of_measure_id_unit_of_measure_id_fk" FOREIGN KEY ("unit_of_measure_id") REFERENCES "public"."unit_of_measure"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipe" ADD CONSTRAINT "recipe_product_id_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kitchen_station" ADD CONSTRAINT "kitchen_station_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kitchen_station" ADD CONSTRAINT "kitchen_station_sucursal_id_sucursal_id_fk" FOREIGN KEY ("sucursal_id") REFERENCES "public"."sucursal"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kitchen_ticket_item" ADD CONSTRAINT "kitchen_ticket_item_ticket_id_kitchen_ticket_id_fk" FOREIGN KEY ("ticket_id") REFERENCES "public"."kitchen_ticket"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kitchen_ticket_item" ADD CONSTRAINT "kitchen_ticket_item_product_id_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kitchen_ticket_item" ADD CONSTRAINT "kitchen_ticket_item_station_id_kitchen_station_id_fk" FOREIGN KEY ("station_id") REFERENCES "public"."kitchen_station"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kitchen_ticket" ADD CONSTRAINT "kitchen_ticket_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kitchen_ticket" ADD CONSTRAINT "kitchen_ticket_sucursal_id_sucursal_id_fk" FOREIGN KEY ("sucursal_id") REFERENCES "public"."sucursal"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kitchen_ticket" ADD CONSTRAINT "kitchen_ticket_sale_id_pos_sale_id_fk" FOREIGN KEY ("sale_id") REFERENCES "public"."pos_sale"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "exchange_rate_org_currencies_active_idx" ON "exchange_rate" USING btree ("organization_id","from_currency","to_currency","is_active");--> statement-breakpoint
CREATE INDEX "kitchen_ticket_sucursal_status_idx" ON "kitchen_ticket" USING btree ("sucursal_id","status");--> statement-breakpoint
ALTER TABLE "order_detail" ADD CONSTRAINT "order_detail_combo_template_id_product_id_fk" FOREIGN KEY ("combo_template_id") REFERENCES "public"."product"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pos_sale_line" ADD CONSTRAINT "pos_sale_line_combo_template_id_product_id_fk" FOREIGN KEY ("combo_template_id") REFERENCES "public"."product"("id") ON DELETE no action ON UPDATE no action;