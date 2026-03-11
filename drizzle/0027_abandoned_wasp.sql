ALTER TABLE "invoice" ADD COLUMN "sucursal_id" uuid;--> statement-breakpoint
ALTER TABLE "invoice" ADD COLUMN "terminal_id" uuid;--> statement-breakpoint
ALTER TABLE "pos_terminal" ADD COLUMN "invoice_prefix" text DEFAULT 'T' NOT NULL;--> statement-breakpoint
ALTER TABLE "pos_terminal" ADD COLUMN "next_invoice_number" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "sucursal" ADD COLUMN "invoice_prefix" text DEFAULT 'M' NOT NULL;--> statement-breakpoint
ALTER TABLE "sucursal" ADD COLUMN "next_invoice_number" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "invoice" ADD CONSTRAINT "invoice_sucursal_id_sucursal_id_fk" FOREIGN KEY ("sucursal_id") REFERENCES "public"."sucursal"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice" ADD CONSTRAINT "invoice_terminal_id_fkey" FOREIGN KEY ("terminal_id") REFERENCES "public"."pos_terminal"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
UPDATE "sucursal" SET "invoice_prefix" = "code";--> statement-breakpoint
CREATE INDEX "invoice_sucursal_idx" ON "invoice" ("sucursal_id");--> statement-breakpoint
CREATE INDEX "invoice_terminal_idx" ON "invoice" ("terminal_id");