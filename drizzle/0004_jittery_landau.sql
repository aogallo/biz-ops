ALTER TABLE "appointment" ADD COLUMN "reminder_sent_at" timestamp;--> statement-breakpoint
ALTER TABLE "business_partner" ADD COLUMN "phone" text;--> statement-breakpoint
ALTER TABLE "business_partner" ADD COLUMN "notes" text;--> statement-breakpoint
ALTER TABLE "service" ADD COLUMN "price" numeric(12, 2);