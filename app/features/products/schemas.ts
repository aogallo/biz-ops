import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { productModel } from "~/server/db/schemas/products";

// Base schemas from Drizzle
export const insertProductSchema = createInsertSchema(productModel, {
  // Enhance with custom validation
  price: z
    .string()
    .regex(
      /^\d+(\.\d{1,2})?$/,
      "Price must be a valid decimal with up to 2 decimal places",
    ),
  sku: z
    .string()
    .min(1, "SKU is required")
    .max(50, "SKU must not exceed 50 characters"),
  name: z
    .string()
    .min(1, "Product name is required")
    .max(200, "Name must not exceed 200 characters"),
  stock: z.number().int().min(0, "Stock cannot be negative").optional(),
});

export const selectProductSchema = createSelectSchema(productModel);

// Create schema (omit id, timestamps)
export const createProductSchema = insertProductSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Update schema (all fields optional except id)
export const updateProductSchema = insertProductSchema
  .partial()
  .required({ id: true })
  .omit({ createdAt: true, updatedAt: true });

// Type exports
export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type Product = z.infer<typeof selectProductSchema>;
