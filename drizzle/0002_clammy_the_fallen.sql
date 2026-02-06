CREATE TYPE "public"."invoice_source" AS ENUM('manual', 'sat');--> statement-breakpoint
ALTER TABLE "invoice" ADD COLUMN "source" "invoice_source" DEFAULT 'manual' NOT NULL;--> statement-breakpoint
ALTER TABLE "organization_accounting_config" ADD COLUMN "manual_invoice_prefix" text DEFAULT 'M' NOT NULL;--> statement-breakpoint
ALTER TABLE "organization_accounting_config" ADD COLUMN "next_manual_invoice_number" integer DEFAULT 1 NOT NULL;