ALTER TABLE "pos_sale" ADD COLUMN "company_id" uuid;--> statement-breakpoint
ALTER TABLE "pos_terminal" ADD COLUMN "company_id" uuid;--> statement-breakpoint
ALTER TABLE "pos_sale" ADD CONSTRAINT "pos_sale_company_id_company_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."company"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pos_terminal" ADD CONSTRAINT "pos_terminal_company_id_company_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."company"("id") ON DELETE no action ON UPDATE no action;