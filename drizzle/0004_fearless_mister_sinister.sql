ALTER TABLE "sat_file" ALTER COLUMN "company_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "sat_file" ADD COLUMN "invoice_type" text NOT NULL;