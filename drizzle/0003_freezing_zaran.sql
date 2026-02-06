-- Step 1: Add the column as nullable first
ALTER TABLE "invoice" ADD COLUMN "accounting_account_id" uuid;

--> statement-breakpoint

-- Step 2: Migrate data - copy first line's account to each invoice
UPDATE "invoice" i
SET "accounting_account_id" = (
    SELECT il."accounting_account_id"
    FROM "invoice_line" il
    WHERE il."invoice_id" = i."id"
    ORDER BY il."line_number"
    LIMIT 1
)
WHERE EXISTS (
    SELECT 1 FROM "invoice_line" il WHERE il."invoice_id" = i."id"
);

--> statement-breakpoint

-- Step 3: For invoices without lines, we need to handle them
-- Set a default account from the organization's config or delete orphan invoices
-- For now, we'll delete draft invoices without lines (they're incomplete anyway)
DELETE FROM "invoice" WHERE "accounting_account_id" IS NULL AND "status" = 'draft';

--> statement-breakpoint

-- Step 4: For any remaining invoices without account (should be none if data is clean)
-- We can't leave them without an account, so we'll need to check if any exist
-- If the migration fails here, it means there are posted/pending invoices without lines
-- which shouldn't happen in normal business flow

--> statement-breakpoint

-- Step 5: Make the column NOT NULL
ALTER TABLE "invoice" ALTER COLUMN "accounting_account_id" SET NOT NULL;

--> statement-breakpoint

-- Step 6: Add foreign key constraint
ALTER TABLE "invoice" ADD CONSTRAINT "invoice_accounting_account_id_accounting_account_id_fk" FOREIGN KEY ("accounting_account_id") REFERENCES "public"."accounting_account"("id") ON DELETE no action ON UPDATE no action;

--> statement-breakpoint

-- Step 7: Drop the constraint from invoice_line
ALTER TABLE "invoice_line" DROP CONSTRAINT "invoice_line_accounting_account_id_accounting_account_id_fk";

--> statement-breakpoint

-- Step 8: Drop the column from invoice_line
ALTER TABLE "invoice_line" DROP COLUMN "accounting_account_id";
