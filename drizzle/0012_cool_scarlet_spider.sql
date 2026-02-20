CREATE TYPE "public"."pos_cash_movement_type" AS ENUM('sale', 'refund', 'withdrawal', 'deposit');--> statement-breakpoint
CREATE TYPE "public"."pos_session_status" AS ENUM('open', 'closed');--> statement-breakpoint
CREATE TABLE "pos_cash_movement" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"type" "pos_cash_movement_type" NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"reference_id" uuid,
	"notes" text,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pos_cashier" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"company_id" uuid NOT NULL,
	"user_id" uuid,
	"name" text NOT NULL,
	"pin" text,
	"pin_attempts" integer DEFAULT 0 NOT NULL,
	"pin_locked_at" timestamp,
	"is_active" boolean DEFAULT true NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pos_session" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"company_id" uuid NOT NULL,
	"terminal_id" uuid NOT NULL,
	"cashier_id" uuid NOT NULL,
	"opened_at" timestamp DEFAULT now() NOT NULL,
	"closed_at" timestamp,
	"opening_cash_amount" numeric(12, 2) NOT NULL,
	"closing_cash_amount" numeric(12, 2),
	"expected_cash_amount" numeric(12, 2),
	"status" "pos_session_status" DEFAULT 'open' NOT NULL,
	"notes" text,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pos_z_report" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"terminal_name" text NOT NULL,
	"cashier_name" text NOT NULL,
	"opened_at" timestamp NOT NULL,
	"closed_at" timestamp NOT NULL,
	"opening_cash" numeric(12, 2),
	"closing_cash" numeric(12, 2),
	"expected_cash" numeric(12, 2),
	"cash_difference" numeric(12, 2),
	"total_sales" numeric(12, 2),
	"total_cash_sales" numeric(12, 2),
	"total_card_sales" numeric(12, 2),
	"total_check_sales" numeric(12, 2),
	"total_refunds" numeric(12, 2),
	"total_withdrawals" numeric(12, 2),
	"total_deposits" numeric(12, 2),
	"total_tax" numeric(12, 2),
	"order_count" integer,
	"first_order_time" timestamp,
	"last_order_time" timestamp,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "pos_z_report_session_id_unique" UNIQUE("session_id")
);
--> statement-breakpoint
ALTER TABLE "pos_sale" ADD COLUMN "session_id" uuid;--> statement-breakpoint
ALTER TABLE "pos_cash_movement" ADD CONSTRAINT "pos_cash_movement_session_id_pos_session_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."pos_session"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pos_cashier" ADD CONSTRAINT "pos_cashier_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pos_cashier" ADD CONSTRAINT "pos_cashier_company_id_company_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."company"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pos_cashier" ADD CONSTRAINT "pos_cashier_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pos_session" ADD CONSTRAINT "pos_session_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pos_session" ADD CONSTRAINT "pos_session_company_id_company_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."company"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pos_session" ADD CONSTRAINT "pos_session_terminal_id_pos_terminal_id_fk" FOREIGN KEY ("terminal_id") REFERENCES "public"."pos_terminal"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pos_session" ADD CONSTRAINT "pos_session_cashier_id_pos_cashier_id_fk" FOREIGN KEY ("cashier_id") REFERENCES "public"."pos_cashier"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pos_z_report" ADD CONSTRAINT "pos_z_report_session_id_pos_session_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."pos_session"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pos_z_report" ADD CONSTRAINT "pos_z_report_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;