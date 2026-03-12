DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pos_sale' AND column_name = 'company_id'
  ) THEN
    ALTER TABLE "pos_sale" ADD COLUMN "company_id" uuid;
  END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pos_terminal' AND column_name = 'company_id'
  ) THEN
    ALTER TABLE "pos_terminal" ADD COLUMN "company_id" uuid;
  END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'pos_sale_company_id_company_id_fk' AND table_name = 'pos_sale'
  ) THEN
    ALTER TABLE "pos_sale" ADD CONSTRAINT "pos_sale_company_id_company_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."company"("id") ON DELETE no action ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'pos_terminal_company_id_company_id_fk' AND table_name = 'pos_terminal'
  ) THEN
    ALTER TABLE "pos_terminal" ADD CONSTRAINT "pos_terminal_company_id_company_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."company"("id") ON DELETE no action ON UPDATE no action;
  END IF;
END $$;
