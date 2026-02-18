ALTER TABLE "order_recipient" RENAME COLUMN "order_id" TO "order_detail_id";--> statement-breakpoint
ALTER TABLE "order_recipient" DROP CONSTRAINT "order_recipient_order_id_order_id_fk";
--> statement-breakpoint
ALTER TABLE "order_recipient" ADD CONSTRAINT "order_recipient_order_detail_id_order_detail_id_fk" FOREIGN KEY ("order_detail_id") REFERENCES "public"."order_detail"("id") ON DELETE no action ON UPDATE no action;