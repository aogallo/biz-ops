ALTER TABLE "organization" ADD COLUMN "domain" text;--> statement-breakpoint
ALTER TABLE "organization" ADD CONSTRAINT "organization_domain_unique" UNIQUE("domain");