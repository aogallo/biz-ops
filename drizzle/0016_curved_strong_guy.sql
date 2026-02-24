ALTER TABLE "company" ADD COLUMN "code" text;--> statement-breakpoint
CREATE UNIQUE INDEX "company_code_org_idx" ON "company" USING btree ("organization_id","code");--> statement-breakpoint
CREATE UNIQUE INDEX "cashier_pin_company_idx" ON "pos_cashier" USING btree ("company_id","pin");