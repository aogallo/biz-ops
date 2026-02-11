CREATE TYPE "public"."product_category_color" AS ENUM('blue', 'green', 'orange', 'teal', 'purple', 'red', 'yellow', 'pink', 'indigo', 'gray');--> statement-breakpoint
CREATE TABLE "product_category" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"name" text NOT NULL,
	"color" "product_category_color" DEFAULT 'blue' NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "product" ADD COLUMN "category_id" uuid;--> statement-breakpoint
ALTER TABLE "product" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "product" ADD COLUMN "image_url" text;--> statement-breakpoint
ALTER TABLE "product" ADD COLUMN "min_stock" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "product_category" ADD CONSTRAINT "product_category_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "product_category_org_name_idx" ON "product_category" USING btree ("organization_id","name");--> statement-breakpoint
ALTER TABLE "product" ADD CONSTRAINT "product_category_id_product_category_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."product_category"("id") ON DELETE no action ON UPDATE no action;