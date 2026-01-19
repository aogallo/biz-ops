CREATE TABLE "sat_file" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"company_id" uuid,
	"business_partner_id" uuid,
	"accounting_account_id" uuid,
	"date" date NOT NULL,
	"authorization_number" text NOT NULL,
	"dte_type" text NOT NULL,
	"serie" text NOT NULL,
	"dte_number" text NOT NULL,
	"emitter_nit" text,
	"emitter_name" text,
	"exportation" boolean DEFAULT false,
	"certificator_nit" text,
	"certificator_name" text,
	"state" text NOT NULL,
	"money" text NOT NULL,
	"total" real NOT NULL,
	"iva" real NOT NULL,
	"is_voided" boolean DEFAULT false,
	"voided_date" date,
	"petroleum" real DEFAULT 0,
	"hotel" real DEFAULT 0,
	"tickets" real DEFAULT 0,
	"press_stamp" real DEFAULT 0,
	"firefighters" real DEFAULT 0,
	"municipal_tax" real DEFAULT 0,
	"alcoholic_tax" real DEFAULT 0,
	"tobacco_tax" real DEFAULT 0,
	"cement_tax" real DEFAULT 0,
	"no_alcoholic_tax" real DEFAULT 0,
	"port_tariff_tax" real DEFAULT 0,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "sat_file" ADD CONSTRAINT "sat_file_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sat_file" ADD CONSTRAINT "sat_file_company_id_company_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."company"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sat_file" ADD CONSTRAINT "sat_file_business_partner_id_business_partner_id_fk" FOREIGN KEY ("business_partner_id") REFERENCES "public"."business_partner"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sat_file" ADD CONSTRAINT "sat_file_accounting_account_id_accounting_account_id_fk" FOREIGN KEY ("accounting_account_id") REFERENCES "public"."accounting_account"("id") ON DELETE no action ON UPDATE no action;