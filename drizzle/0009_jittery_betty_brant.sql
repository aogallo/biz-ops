ALTER TABLE "invitation" DROP CONSTRAINT "invitation_role_id_role_id_fk";
--> statement-breakpoint
ALTER TABLE "member" DROP CONSTRAINT "member_role_id_role_id_fk";
--> statement-breakpoint
CREATE UNIQUE INDEX "sat_file_unique_dte_idx" ON "sat_file" USING btree ("organization_id","company_id","date","authorization_number","dte_type","serie","dte_number");--> statement-breakpoint
ALTER TABLE "invitation" DROP COLUMN "role_id";--> statement-breakpoint
ALTER TABLE "member" DROP COLUMN "role_id";