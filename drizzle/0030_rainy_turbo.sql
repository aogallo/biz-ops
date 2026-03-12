CREATE TYPE "public"."pos_order_type" AS ENUM('dine_in', 'takeout', 'delivery');--> statement-breakpoint
CREATE TYPE "public"."pos_table_status" AS ENUM('available', 'occupied', 'reserved');--> statement-breakpoint
ALTER TYPE "public"."pos_sale_status" ADD VALUE 'open' BEFORE 'completed';--> statement-breakpoint
CREATE TABLE "pos_table" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"sucursal_id" uuid,
	"number" text NOT NULL,
	"capacity" integer,
	"status" "pos_table_status" DEFAULT 'available' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "pos_sale" ADD COLUMN "table_id" uuid;--> statement-breakpoint
ALTER TABLE "pos_sale" ADD COLUMN "order_type" "pos_order_type" DEFAULT 'takeout' NOT NULL;--> statement-breakpoint
ALTER TABLE "pos_sale" ADD COLUMN "cover_count" integer;--> statement-breakpoint
ALTER TABLE "pos_table" ADD CONSTRAINT "pos_table_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pos_table" ADD CONSTRAINT "pos_table_sucursal_id_sucursal_id_fk" FOREIGN KEY ("sucursal_id") REFERENCES "public"."sucursal"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "pos_table_org_idx" ON "pos_table" USING btree ("organization_id","is_active");--> statement-breakpoint
CREATE INDEX "pos_table_sucursal_idx" ON "pos_table" USING btree ("sucursal_id","status");--> statement-breakpoint
ALTER TABLE "pos_sale" ADD CONSTRAINT "pos_sale_table_id_pos_table_id_fk" FOREIGN KEY ("table_id") REFERENCES "public"."pos_table"("id") ON DELETE no action ON UPDATE no action;