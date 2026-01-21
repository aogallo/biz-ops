CREATE TABLE "accounting_account" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"name" text,
	"account_number" text
);
--> statement-breakpoint
ALTER TABLE "accounting_account" ADD CONSTRAINT "accounting_account_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;