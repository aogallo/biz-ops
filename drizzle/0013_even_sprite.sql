ALTER TYPE "public"."journal_entry_source" ADD VALUE 'pos';--> statement-breakpoint
ALTER TABLE "journal_entry" ADD COLUMN "source_pos_session_id" uuid;--> statement-breakpoint
ALTER TABLE "organization_accounting_config" ADD COLUMN "pos_cash_account_id" uuid;--> statement-breakpoint
ALTER TABLE "organization_accounting_config" ADD COLUMN "pos_card_account_id" uuid;--> statement-breakpoint
ALTER TABLE "organization_accounting_config" ADD COLUMN "pos_check_account_id" uuid;--> statement-breakpoint
ALTER TABLE "organization_accounting_config" ADD CONSTRAINT "organization_accounting_config_pos_cash_account_id_accounting_account_id_fk" FOREIGN KEY ("pos_cash_account_id") REFERENCES "public"."accounting_account"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_accounting_config" ADD CONSTRAINT "organization_accounting_config_pos_card_account_id_accounting_account_id_fk" FOREIGN KEY ("pos_card_account_id") REFERENCES "public"."accounting_account"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_accounting_config" ADD CONSTRAINT "organization_accounting_config_pos_check_account_id_accounting_account_id_fk" FOREIGN KEY ("pos_check_account_id") REFERENCES "public"."accounting_account"("id") ON DELETE no action ON UPDATE no action;