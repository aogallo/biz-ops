ALTER TABLE "business_partner" ADD COLUMN "nit" text;--> statement-breakpoint
ALTER TABLE "sat_file" ADD COLUMN "receptor_nit" text;--> statement-breakpoint
ALTER TABLE "sat_file" ADD COLUMN "receptor_name" text;--> statement-breakpoint
CREATE UNIQUE INDEX "business_partner_nit_org_idx" ON "business_partner" USING btree ("organization_id","nit");