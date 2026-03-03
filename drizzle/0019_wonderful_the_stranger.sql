ALTER TABLE "pos_cashier" DROP CONSTRAINT "pos_cashier_sucursal_id_sucursal_id_fk";
--> statement-breakpoint
DROP INDEX "cashier_pin_sucursal_idx";--> statement-breakpoint
CREATE UNIQUE INDEX "cashier_pin_org_idx" ON "pos_cashier" USING btree ("organization_id","pin");--> statement-breakpoint
ALTER TABLE "pos_cashier" DROP COLUMN "sucursal_id";