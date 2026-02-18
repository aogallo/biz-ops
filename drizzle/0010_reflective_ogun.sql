CREATE TYPE "public"."quotation_status" AS ENUM('DRAFT', 'SENT', 'ACCEPTED', 'REJECTED');--> statement-breakpoint
CREATE TABLE "quotation_detail" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"quotation_id" uuid NOT NULL,
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
CREATE TABLE "quotation" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"company_id" uuid NOT NULL,
	"business_partner_id" uuid NOT NULL,
	"status" "quotation_status" DEFAULT 'DRAFT' NOT NULL,
	"quotation_date" date DEFAULT now() NOT NULL,
	"quotation_number" text NOT NULL,
	"currency_code" text DEFAULT 'GT',
	"converted_order_id" uuid,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quotation_recipient" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"quotation_detail_id" uuid NOT NULL,
	"name" text NOT NULL,
	"metadata_json" jsonb
);
--> statement-breakpoint
ALTER TABLE "quotation_detail" ADD CONSTRAINT "quotation_detail_quotation_id_quotation_id_fk" FOREIGN KEY ("quotation_id") REFERENCES "public"."quotation"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotation_detail" ADD CONSTRAINT "quotation_detail_product_id_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotation" ADD CONSTRAINT "quotation_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotation" ADD CONSTRAINT "quotation_company_id_company_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."company"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotation" ADD CONSTRAINT "quotation_business_partner_id_business_partner_id_fk" FOREIGN KEY ("business_partner_id") REFERENCES "public"."business_partner"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotation" ADD CONSTRAINT "quotation_converted_order_id_order_id_fk" FOREIGN KEY ("converted_order_id") REFERENCES "public"."order"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotation_recipient" ADD CONSTRAINT "quotation_recipient_quotation_detail_id_quotation_detail_id_fk" FOREIGN KEY ("quotation_detail_id") REFERENCES "public"."quotation_detail"("id") ON DELETE no action ON UPDATE no action;