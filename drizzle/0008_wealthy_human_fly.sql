CREATE TYPE "public"."order_source_type" AS ENUM('INVENTORY', 'ON_DEMAND');--> statement-breakpoint
CREATE TYPE "public"."order_status" AS ENUM('DRAFT', 'CONFIRMED', 'COMPLETED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."product_type" AS ENUM('STOCK', 'MADE_TO_ORDER', 'SERVICE');--> statement-breakpoint
CREATE TABLE "order_detail" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"product_name" text NOT NULL,
	"product_sku" text,
	"quantity" integer NOT NULL,
	"unit_price" numeric(12, 2) NOT NULL,
	"source_type" "order_source_type" NOT NULL,
	"line_total" numeric(12, 2) NOT NULL,
	"custom_attributes_json" jsonb
);
--> statement-breakpoint
CREATE TABLE "order" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"company_id" uuid NOT NULL,
	"business_partner_id" uuid NOT NULL,
	"status" "order_status" DEFAULT 'DRAFT' NOT NULL,
	"order_date" date DEFAULT now() NOT NULL,
	"order_number" text NOT NULL,
	"currency_code" text DEFAULT 'GT',
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_recipient" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"name" text NOT NULL,
	"metadata_json" jsonb
);
--> statement-breakpoint
ALTER TABLE "product" ADD COLUMN "product_type" "product_type" DEFAULT 'STOCK' NOT NULL;--> statement-breakpoint
ALTER TABLE "product" ADD COLUMN "attributes_json" jsonb;--> statement-breakpoint
ALTER TABLE "organization_accounting_config" ADD COLUMN "order_prefix" text DEFAULT 'OR' NOT NULL;--> statement-breakpoint
ALTER TABLE "organization_accounting_config" ADD COLUMN "next_order_number" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "order_detail" ADD CONSTRAINT "order_detail_order_id_order_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."order"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_detail" ADD CONSTRAINT "order_detail_product_id_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order" ADD CONSTRAINT "order_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order" ADD CONSTRAINT "order_company_id_company_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."company"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order" ADD CONSTRAINT "order_business_partner_id_business_partner_id_fk" FOREIGN KEY ("business_partner_id") REFERENCES "public"."business_partner"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_recipient" ADD CONSTRAINT "order_recipient_order_id_order_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."order"("id") ON DELETE no action ON UPDATE no action;