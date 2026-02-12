CREATE TYPE "public"."document_type" AS ENUM('FCE', 'FAUCI', 'FPE', 'NC', 'DA', 'RCE', 'FCAM', 'NABN', 'OTRO');--> statement-breakpoint
CREATE TYPE "public"."invoice_line_type" AS ENUM('goods', 'services');--> statement-breakpoint
CREATE TYPE "public"."transaction_type" AS ENUM('L', 'I', 'D');--> statement-breakpoint
ALTER TABLE "invoice_line" ADD COLUMN "line_type" "invoice_line_type" DEFAULT 'goods';--> statement-breakpoint
ALTER TABLE "invoice" ADD COLUMN "document_type" "document_type" DEFAULT 'FCE';--> statement-breakpoint
ALTER TABLE "invoice" ADD COLUMN "transaction_type" "transaction_type" DEFAULT 'L';