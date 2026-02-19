CREATE TYPE "public"."pos_payment_method" AS ENUM('cash', 'card', 'check');--> statement-breakpoint
CREATE TYPE "public"."pos_sale_status" AS ENUM('completed', 'voided', 'refunded');--> statement-breakpoint
CREATE TABLE "pos_payment" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sale_id" uuid NOT NULL,
	"method" "pos_payment_method" NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"received_amount" numeric(12, 2),
	"change_amount" numeric(12, 2),
	"reference" text,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pos_sale_line" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sale_id" uuid NOT NULL,
	"line_number" integer NOT NULL,
	"product_id" uuid NOT NULL,
	"product_name" text NOT NULL,
	"product_sku" text NOT NULL,
	"quantity" numeric(12, 4) DEFAULT '1' NOT NULL,
	"unit_price" numeric(12, 2) NOT NULL,
	"discount_percent" numeric(5, 2) DEFAULT '0' NOT NULL,
	"discount_amount" numeric(12, 2) DEFAULT '0' NOT NULL,
	"subtotal" numeric(12, 2) NOT NULL,
	"iva_type" "iva_type" DEFAULT 'taxed' NOT NULL,
	"iva_rate" numeric(5, 2) DEFAULT '12.00' NOT NULL,
	"iva_amount" numeric(12, 2) DEFAULT '0' NOT NULL,
	"total" numeric(12, 2) NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pos_sale" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"company_id" uuid NOT NULL,
	"terminal_id" uuid NOT NULL,
	"cashier_id" uuid NOT NULL,
	"business_partner_id" uuid NOT NULL,
	"sale_number" text NOT NULL,
	"status" "pos_sale_status" DEFAULT 'completed' NOT NULL,
	"subtotal" numeric(12, 2) NOT NULL,
	"iva_amount" numeric(12, 2) DEFAULT '0' NOT NULL,
	"discount_amount" numeric(12, 2) DEFAULT '0' NOT NULL,
	"total" numeric(12, 2) NOT NULL,
	"currency" text DEFAULT 'GTQ' NOT NULL,
	"invoice_id" uuid,
	"notes" text,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pos_terminal" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"company_id" uuid NOT NULL,
	"name" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"auto_generate_invoice" boolean DEFAULT false NOT NULL,
	"default_business_partner_id" uuid,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "organization_accounting_config" ADD COLUMN "pos_prefix" text DEFAULT 'POS' NOT NULL;--> statement-breakpoint
ALTER TABLE "organization_accounting_config" ADD COLUMN "next_pos_sale_number" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "pos_payment" ADD CONSTRAINT "pos_payment_sale_id_pos_sale_id_fk" FOREIGN KEY ("sale_id") REFERENCES "public"."pos_sale"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pos_sale_line" ADD CONSTRAINT "pos_sale_line_sale_id_pos_sale_id_fk" FOREIGN KEY ("sale_id") REFERENCES "public"."pos_sale"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pos_sale_line" ADD CONSTRAINT "pos_sale_line_product_id_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pos_sale" ADD CONSTRAINT "pos_sale_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pos_sale" ADD CONSTRAINT "pos_sale_company_id_company_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."company"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pos_sale" ADD CONSTRAINT "pos_sale_terminal_id_pos_terminal_id_fk" FOREIGN KEY ("terminal_id") REFERENCES "public"."pos_terminal"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pos_sale" ADD CONSTRAINT "pos_sale_cashier_id_user_id_fk" FOREIGN KEY ("cashier_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pos_sale" ADD CONSTRAINT "pos_sale_business_partner_id_business_partner_id_fk" FOREIGN KEY ("business_partner_id") REFERENCES "public"."business_partner"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pos_sale" ADD CONSTRAINT "pos_sale_invoice_id_invoice_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoice"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pos_terminal" ADD CONSTRAINT "pos_terminal_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pos_terminal" ADD CONSTRAINT "pos_terminal_company_id_company_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."company"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pos_terminal" ADD CONSTRAINT "pos_terminal_default_business_partner_id_business_partner_id_fk" FOREIGN KEY ("default_business_partner_id") REFERENCES "public"."business_partner"("id") ON DELETE no action ON UPDATE no action;