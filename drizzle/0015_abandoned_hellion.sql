ALTER TABLE "pos_sale" DROP CONSTRAINT IF EXISTS "pos_sale_cashier_id_user_id_fk";
--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'pos_sale_cashier_id_pos_cashier_id_fk'
    AND table_name = 'pos_sale'
  ) THEN
    ALTER TABLE "pos_sale" ADD CONSTRAINT "pos_sale_cashier_id_pos_cashier_id_fk"
      FOREIGN KEY ("cashier_id") REFERENCES "public"."pos_cashier"("id")
      ON DELETE no action ON UPDATE no action;
  END IF;
END $$;
