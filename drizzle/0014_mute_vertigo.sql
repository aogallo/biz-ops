ALTER TABLE "pos_sale" ADD COLUMN "idempotency_key" uuid;--> statement-breakpoint
CREATE INDEX "product_org_type_idx" ON "product" USING btree ("organization_id","product_type");--> statement-breakpoint
CREATE UNIQUE INDEX "pos_sale_idempotency_key_idx" ON "pos_sale" USING btree ("idempotency_key");--> statement-breakpoint
CREATE INDEX "pos_sale_terminal_created_idx" ON "pos_sale" USING btree ("terminal_id","created_at");--> statement-breakpoint
CREATE INDEX "pos_sale_status_idx" ON "pos_sale" USING btree ("status");--> statement-breakpoint
CREATE INDEX "pos_sale_org_created_idx" ON "pos_sale" USING btree ("organization_id","created_at");--> statement-breakpoint
CREATE INDEX "pos_terminal_org_active_idx" ON "pos_terminal" USING btree ("organization_id","is_active");