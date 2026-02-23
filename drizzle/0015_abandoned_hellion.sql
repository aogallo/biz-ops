ALTER TABLE "pos_sale" DROP CONSTRAINT "pos_sale_cashier_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "pos_sale" ADD CONSTRAINT "pos_sale_cashier_id_pos_cashier_id_fk" FOREIGN KEY ("cashier_id") REFERENCES "public"."pos_cashier"("id") ON DELETE no action ON UPDATE no action;